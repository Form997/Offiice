import { createServer } from "node:http";
import { randomBytes, randomUUID, createHash, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Pool } from "pg";
import { describeDevice, normalizeUserAgent, isSessionIdleExpired, hasUserAgentChanged, SESSION_IDLE_TTL_MS, SESSION_ABSOLUTE_TTL_MS } from "./session-security.js";
import { generateTotpSecret, verifyTotp, encryptTotpSecret, decryptTotpSecret, makeRecoveryCode, normalizeRecoveryCode, buildOtpAuthUri } from "./mfa-totp.js";
const scrypt = promisify(scryptCb);
const ROLES = new Set(["admin","signer","auditor","viewer"]);
const SESSION_TTL = 8 * 60 * 60 * 1000;
const hash = value => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const cookie = (name,value,age) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const clearCookie = name => `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
const json = (res,status,data,headers={}) => { res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",...headers});res.end(JSON.stringify(data)); };
const safeUser = u => ({id:u.id,email:u.email||u.email_normalized,displayName:u.display_name,role:u.role,status:u.status});
function cookies(req){return Object.fromEntries((req.headers.cookie||"").split(";").map(x=>x.trim().split(/=(.*)/s)).filter(x=>x.length===2));}
async function body(req){let s="";for await(const chunk of req){s+=chunk;if(s.length>16384)throw Object.assign(new Error("Body too large"),{status:413,code:"BODY_TOO_LARGE"});}try{return s?JSON.parse(s):{};}catch{throw Object.assign(new Error("Invalid JSON"),{status:400,code:"INVALID_JSON"});}}
function passwordValid(p){return typeof p==="string"&&p.length>=12&&p.length<=256;}
async function passwordHash(password,salt= randomBytes(16).toString("hex")){const key=await scrypt(password,salt,64);return {salt,hash:key.toString("hex")};}
function same(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export function createSghtAuthServer({pool,allowedOrigin,mailer=null,secureCookies=true,now=()=>Date.now()}){
 if(!pool||!allowedOrigin)throw new Error("pool and allowedOrigin are required");
 const originUrl=new URL(allowedOrigin);if(secureCookies&&originUrl.protocol!=="https:")throw new Error("HTTPS origin required");
 const cookieOpts=secureCookies;
 const attempts=new Map();
 const rateLimit=(key,limit=12)=>{const t=now(),entry=attempts.get(key)||{start:t,count:0};if(t-entry.start>60000){entry.start=t;entry.count=0;}entry.count++;attempts.set(key,entry);return entry.count<=limit;};
 const app=createServer(async(req,res)=>{
  const requestId=randomUUID();
  try{
   const origin=req.headers.origin;
   if(origin&&origin!==allowedOrigin)return json(res,403,{code:"ORIGIN_DENIED",message:"Origin not allowed."});
   if(origin===allowedOrigin)res.setHeader("Access-Control-Allow-Origin",allowedOrigin),res.setHeader("Access-Control-Allow-Credentials","true"),res.setHeader("Vary","Origin");
   res.setHeader("X-Frame-Options","DENY");res.setHeader("Content-Security-Policy","default-src 'none'; frame-ancestors 'none'");
   if(req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Methods","GET,POST,PATCH,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type,X-CSRF-Token");res.setHeader("Access-Control-Max-Age","600");return json(res,204,{});}
   const path=new URL(req.url,"http://localhost").pathname, method=req.method;
   const jar=cookies(req);
   const issueCsrf=()=>{const value=token();res.setHeader("Set-Cookie",`sght_csrf=${value}; Path=/; SameSite=Strict; Max-Age=1800${cookieOpts?"; Secure":""}`);return value;};
   const checkCsrf=async()=>{if(req.headers.origin!==allowedOrigin)throw Object.assign(new Error("Origin rejected"),{status:403,code:"ORIGIN_DENIED"});const c=jar.sght_csrf,h=req.headers["x-csrf-token"];if(!c||!h||!same(c,h))throw Object.assign(new Error("CSRF rejected"),{status:403,code:"CSRF_INVALID"});if(jar.sght_session){const bound=await pool.query("SELECT csrf_hash FROM sght_sessions WHERE id_hash=$1 AND revoked_at IS NULL AND expires_at>now()",[hash(jar.sght_session)]);if(bound.rowCount&&!same(hash(c),bound.rows[0].csrf_hash))throw Object.assign(new Error("Session CSRF binding rejected"),{status:403,code:"CSRF_INVALID"});}};
   const session=async()=>{const raw=jar.sght_session;if(!raw)return null;const q=await pool.query("SELECT s.id_hash,s.user_id,u.email,u.display_name,u.role,u.status,s.expires_at,s.public_id,s.last_seen_at,s.user_agent FROM sght_sessions s JOIN sght_users u ON u.id=s.user_id WHERE s.id_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now()",[hash(raw)]);if(!q.rowCount)return null;const u=q.rows[0];if(u.status!=="active"||isSessionIdleExpired(u.last_seen_at,now(),SESSION_IDLE_TTL_MS)){await pool.query("UPDATE sght_sessions SET revoked_at=now() WHERE id_hash=$1 AND revoked_at IS NULL",[u.id_hash]);res.setHeader("Set-Cookie",[clearCookie("sght_session"),clearCookie("sght_csrf")]);return null;}if(!u.last_seen_at||now()-new Date(u.last_seen_at).getTime()>=60000)await pool.query("UPDATE sght_sessions SET last_seen_at=now() WHERE id_hash=$1 AND revoked_at IS NULL",[u.id_hash]);u.deviceChanged=hasUserAgentChanged(u.user_agent,req.headers["user-agent"]);return u;};
   const requireUser=async()=>{const u=await session();if(!u)throw Object.assign(new Error("Authentication required"),{status:401,code:"UNAUTHENTICATED"});return u;};
   const requireAdmin=async()=>{const u=await requireUser();if(u.role!=="admin")throw Object.assign(new Error("Forbidden"),{status:403,code:"FORBIDDEN"});return u;};
   if(method==="GET"&&path==="/v1/auth/csrf"){const csrf=issueCsrf();if(jar.sght_session)await pool.query("UPDATE sght_sessions SET csrf_hash=$1 WHERE id_hash=$2 AND revoked_at IS NULL AND expires_at>now()",[hash(csrf),hash(jar.sght_session)]);return json(res,200,{csrfToken:csrf});}
   if(method==="POST"&&path==="/v1/auth/login"){
    await checkCsrf();const b=await body(req),email=String(b.email||"").trim().toLowerCase();
    if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof b.password!=="string")return json(res,400,{code:"INVALID_INPUT",message:"Invalid login input."});
    if(!rateLimit("login:"+email,8))return json(res,429,{code:"LOGIN_RATE_LIMITED",message:"Too many login attempts. Try again later."});
    const q=await pool.query("SELECT * FROM sght_users WHERE email_normalized=$1",[email]);const u=q.rows[0];
    const fallback=await passwordHash("not-a-real-password-value");const salt=u?.password_salt||fallback.salt;
    const candidate=(await passwordHash(b.password,salt)).hash;
    if(!u||u.status!=="active"||!u.email_verified_at||!same(candidate,u.password_hash))return json(res,401,{code:"INVALID_CREDENTIALS",message:"Email or password is incorrect."});
    const mfa=await pool.query("SELECT enabled_at FROM sght_user_mfa WHERE user_id=$1 AND enabled_at IS NOT NULL",[u.id]);
    if(mfa.rowCount){const masterKey=process.env.SGHT_MFA_ENCRYPTION_KEY;if(typeof masterKey!=="string"||Buffer.byteLength(masterKey,"utf8")<32)return json(res,503,{code:"MFA_NOT_CONFIGURED",message:"MFA encryption is not configured."});const challenge=token();await pool.query("INSERT INTO sght_mfa_challenges(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '5 minutes')",[hash(challenge),u.id]);return json(res,200,{mfaRequired:true,challengeToken:challenge,expiresInSeconds:300});}
    const sid=token(),csrf=issueCsrf();await pool.query("INSERT INTO sght_sessions(id_hash,user_id,csrf_hash,expires_at,user_agent) VALUES($1,$2,$3,now()+($4 * interval '1 millisecond'),$5)",[hash(sid),u.id,hash(csrf),SESSION_ABSOLUTE_TTL_MS,normalizeUserAgent(req.headers["user-agent"])]);
    res.setHeader("Set-Cookie",[cookie("sght_session",sid,28800),`sght_csrf=${csrf}; Path=/; SameSite=Strict; Max-Age=1800${cookieOpts?"; Secure":""}`]);
    await pool.query("INSERT INTO sght_audit_events(actor_user_id,target_user_id,action,metadata_json,request_id) VALUES($1,$1,'auth.login','{}',$2)",[u.id,requestId]);
    return json(res,200,{user:safeUser(u)});
   }

   if(method==="POST"&&path==="/v1/auth/mfa/login/complete"){
    await checkCsrf();const b=await body(req),challenge=String(b.challengeToken||""),code=String(b.code||"").trim();
    if(challenge.length<32||challenge.length>128||code.length<6||code.length>32)return json(res,400,{code:"MFA_INVALID_INPUT",message:"A valid MFA challenge and code are required."});
    if(!rateLimit("mfa-challenge:"+hash(challenge),6))return json(res,429,{code:"MFA_RATE_LIMITED",message:"Too many MFA attempts. Try again later."});
    const masterKey=process.env.SGHT_MFA_ENCRYPTION_KEY;if(typeof masterKey!=="string"||Buffer.byteLength(masterKey,"utf8")<32)return json(res,503,{code:"MFA_NOT_CONFIGURED",message:"MFA encryption is not configured."});
    const client=await pool.connect();
    try{
     await client.query("BEGIN");
     const cq=await client.query("SELECT id,user_id FROM sght_mfa_challenges WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",[hash(challenge)]);
     if(!cq.rowCount){await client.query("ROLLBACK");return json(res,401,{code:"MFA_CHALLENGE_INVALID",message:"MFA challenge is invalid or expired."});}
     const factor=await client.query("SELECT secret_ciphertext,last_used_step FROM sght_user_mfa WHERE user_id=$1 AND enabled_at IS NOT NULL FOR UPDATE",[cq.rows[0].user_id]);
     if(!factor.rowCount){await client.query("ROLLBACK");return json(res,401,{code:"MFA_NOT_ENABLED",message:"MFA is not enabled for this account."});}
     const secret=decryptTotpSecret(factor.rows[0].secret_ciphertext,masterKey),step=verifyTotp(secret,code,now());
     if(step!==null&&step>Number(factor.rows[0].last_used_step??-1)){
      await client.query("UPDATE sght_user_mfa SET last_used_step=$2 WHERE user_id=$1",[cq.rows[0].user_id,step]);
     }else{
      const recovery=normalizeRecoveryCode(code);
      if(!/^[A-F0-9]{16}$/.test(recovery)){await client.query("ROLLBACK");return json(res,401,{code:"MFA_CODE_INVALID",message:"MFA code is invalid or already used."});}
      const rq=await client.query("SELECT code_hash FROM sght_mfa_recovery_codes WHERE user_id=$1 AND code_hash=$2 FOR UPDATE",[cq.rows[0].user_id,hash(recovery)]);
      if(!rq.rowCount){await client.query("ROLLBACK");return json(res,401,{code:"MFA_CODE_INVALID",message:"MFA code is invalid or already used."});}
      await client.query("DELETE FROM sght_mfa_recovery_codes WHERE user_id=$1 AND code_hash=$2",[cq.rows[0].user_id,hash(recovery)]);
     }
     const uq=await client.query("SELECT id,email_normalized AS email,display_name,role,status FROM sght_users WHERE id=$1 AND status='active' AND email_verified_at IS NOT NULL",[cq.rows[0].user_id]);
     if(!uq.rowCount){await client.query("ROLLBACK");return json(res,401,{code:"INVALID_CREDENTIALS",message:"Account is not eligible to sign in."});}
     const user=uq.rows[0],sid=token(),csrf=token();
     await client.query("INSERT INTO sght_sessions(id_hash,user_id,csrf_hash,expires_at,user_agent) VALUES($1,$2,$3,now()+($4 * interval '1 millisecond'),$5)",[hash(sid),user.id,hash(csrf),SESSION_ABSOLUTE_TTL_MS,normalizeUserAgent(req.headers["user-agent"])]);
     await client.query("UPDATE sght_mfa_challenges SET consumed_at=now() WHERE id=$1",[cq.rows[0].id]);
     await client.query("INSERT INTO sght_audit_events(actor_user_id,target_user_id,action,metadata_json,request_id) VALUES($1,$1,'auth.mfa_login','{}',$2)",[user.id,requestId]);
     await client.query("COMMIT");
     res.setHeader("Set-Cookie",[cookie("sght_session",sid,Math.floor(SESSION_ABSOLUTE_TTL_MS/1000)),'sght_csrf='+csrf+'; Path=/; SameSite=Strict; Max-Age=1800'+(cookieOpts?'; Secure':'')]);
     return json(res,200,{user:safeUser(user)});
    }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
   }
   if(method==="GET"&&path==="/v1/auth/mfa/status"){const u=await requireUser();const q=await pool.query("SELECT enabled_at FROM sght_user_mfa WHERE user_id=$1",[u.user_id]);const count=await pool.query("SELECT count(*)::int AS remaining FROM sght_mfa_recovery_codes WHERE user_id=$1",[u.user_id]);return json(res,200,{enabled:!!q.rows[0]?.enabled_at,recoveryCodesRemaining:count.rows[0]?.remaining||0});}
   if(method==="POST"&&path==="/v1/auth/mfa/enroll"){
    await checkCsrf();const u=await requireUser();if(!rateLimit("mfa-enroll:"+u.user_id,4))return json(res,429,{code:"MFA_RATE_LIMITED",message:"Too many MFA setup attempts."});
    const masterKey=process.env.SGHT_MFA_ENCRYPTION_KEY;if(typeof masterKey!=="string"||Buffer.byteLength(masterKey,"utf8")<32)return json(res,503,{code:"MFA_NOT_CONFIGURED",message:"MFA encryption is not configured."});
    const secret=generateTotpSecret(),encrypted=encryptTotpSecret(secret,masterKey);
    const q=await pool.query("INSERT INTO sght_user_mfa(user_id,pending_secret_ciphertext,pending_expires_at) VALUES($1,$2,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET pending_secret_ciphertext=EXCLUDED.pending_secret_ciphertext,pending_expires_at=EXCLUDED.pending_expires_at WHERE sght_user_mfa.enabled_at IS NULL RETURNING user_id",[u.user_id,encrypted]);
    if(!q.rowCount)return json(res,409,{code:"MFA_ALREADY_ENABLED",message:"MFA is already enabled."});
    return json(res,200,{secret,otpauthUri:buildOtpAuthUri(secret,u.email),expiresInSeconds:600});
   }
   if(method==="POST"&&path==="/v1/auth/mfa/enable"){
    await checkCsrf();const u=await requireUser(),b=await body(req),code=String(b.code||"").trim();
    if(!/^\d{6}$/.test(code))return json(res,400,{code:"MFA_INVALID_INPUT",message:"Enter the six-digit authenticator code."});
    if(!rateLimit("mfa-enable:"+u.user_id,6))return json(res,429,{code:"MFA_RATE_LIMITED",message:"Too many MFA verification attempts."});
    const masterKey=process.env.SGHT_MFA_ENCRYPTION_KEY;if(typeof masterKey!=="string"||Buffer.byteLength(masterKey,"utf8")<32)return json(res,503,{code:"MFA_NOT_CONFIGURED",message:"MFA encryption is not configured."});
    const client=await pool.connect();try{
     await client.query("BEGIN");
     const q=await client.query("SELECT pending_secret_ciphertext,pending_expires_at,enabled_at FROM sght_user_mfa WHERE user_id=$1 FOR UPDATE",[u.user_id]);
     if(!q.rowCount||q.rows[0].enabled_at||!q.rows[0].pending_secret_ciphertext||new Date(q.rows[0].pending_expires_at).getTime()<=now()){await client.query("ROLLBACK");return json(res,400,{code:"MFA_SETUP_EXPIRED",message:"Start MFA setup again; the pending setup has expired."});}
     const secret=decryptTotpSecret(q.rows[0].pending_secret_ciphertext,masterKey),step=verifyTotp(secret,code,now());
     if(step===null){await client.query("ROLLBACK");return json(res,400,{code:"MFA_CODE_INVALID",message:"Authenticator code is invalid."});}
     await client.query("UPDATE sght_user_mfa SET secret_ciphertext=pending_secret_ciphertext,pending_secret_ciphertext=NULL,pending_expires_at=NULL,enabled_at=now(),last_used_step=$2 WHERE user_id=$1",[u.user_id,step]);
     const recoveryCodes=Array.from({length:10},makeRecoveryCode);
     for(const recovery of recoveryCodes)await client.query("INSERT INTO sght_mfa_recovery_codes(user_id,code_hash) VALUES($1,$2)",[u.user_id,hash(normalizeRecoveryCode(recovery))]);
     await client.query("INSERT INTO sght_audit_events(actor_user_id,target_user_id,action,metadata_json,request_id) VALUES($1,$1,'auth.mfa_enabled',$2,$3)",[u.user_id,JSON.stringify({recoveryCodeCount:recoveryCodes.length}),requestId]);
     await client.query("COMMIT");return json(res,200,{ok:true,recoveryCodes});
    }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
   }
   if(method==="POST"&&path==="/v1/auth/mfa/disable"){
    await checkCsrf();const u=await requireUser(),b=await body(req),password=String(b.password||""),code=String(b.code||"").trim();
    if(!password||code.length<6||code.length>32)return json(res,400,{code:"MFA_INVALID_INPUT",message:"Password and MFA code are required."});
    if(!rateLimit("mfa-disable:"+u.user_id,5))return json(res,429,{code:"MFA_RATE_LIMITED",message:"Too many MFA disable attempts."});
    const masterKey=process.env.SGHT_MFA_ENCRYPTION_KEY;if(typeof masterKey!=="string"||Buffer.byteLength(masterKey,"utf8")<32)return json(res,503,{code:"MFA_NOT_CONFIGURED",message:"MFA encryption is not configured."});
    const client=await pool.connect();try{
     await client.query("BEGIN");
     const uq=await client.query("SELECT password_hash,password_salt FROM sght_users WHERE id=$1 AND status='active' FOR UPDATE",[u.user_id]);
     if(!uq.rowCount||!same((await passwordHash(password,uq.rows[0].password_salt)).hash,uq.rows[0].password_hash)){await client.query("ROLLBACK");return json(res,401,{code:"MFA_REAUTH_REQUIRED",message:"Password is incorrect."});}
     const fq=await client.query("SELECT secret_ciphertext,last_used_step FROM sght_user_mfa WHERE user_id=$1 AND enabled_at IS NOT NULL FOR UPDATE",[u.user_id]);
     if(!fq.rowCount){await client.query("ROLLBACK");return json(res,409,{code:"MFA_NOT_ENABLED",message:"MFA is not enabled."});}
     const secret=decryptTotpSecret(fq.rows[0].secret_ciphertext,masterKey),step=verifyTotp(secret,code,now());
     if(step!==null&&step>Number(fq.rows[0].last_used_step??-1))await client.query("UPDATE sght_user_mfa SET last_used_step=$2 WHERE user_id=$1",[u.user_id,step]);
     else{
      const recovery=normalizeRecoveryCode(code);
      if(!/^[A-F0-9]{16}$/.test(recovery)){await client.query("ROLLBACK");return json(res,401,{code:"MFA_CODE_INVALID",message:"MFA code is invalid or already used."});}
      const rq=await client.query("SELECT code_hash FROM sght_mfa_recovery_codes WHERE user_id=$1 AND code_hash=$2 FOR UPDATE",[u.user_id,hash(recovery)]);
      if(!rq.rowCount){await client.query("ROLLBACK");return json(res,401,{code:"MFA_CODE_INVALID",message:"MFA code is invalid or already used."});}
     }
     await client.query("DELETE FROM sght_mfa_recovery_codes WHERE user_id=$1",[u.user_id]);
     await client.query("DELETE FROM sght_user_mfa WHERE user_id=$1",[u.user_id]);
     await client.query("UPDATE sght_mfa_challenges SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL",[u.user_id]);
     await client.query("INSERT INTO sght_audit_events(actor_user_id,target_user_id,action,metadata_json,request_id) VALUES($1,$1,'auth.mfa_disabled','{}',$2)",[u.user_id,requestId]);
     await client.query("COMMIT");return json(res,200,{ok:true});
    }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
   }
   if(method==="GET"&&path==="/v1/auth/me"){const u=await requireUser();return json(res,200,{user:safeUser(u)});}
   if(method==="POST"&&path==="/v1/auth/logout"){await checkCsrf();const raw=jar.sght_session;if(raw)await pool.query("UPDATE sght_sessions SET revoked_at=now() WHERE id_hash=$1 AND revoked_at IS NULL",[hash(raw)]);res.setHeader("Set-Cookie",[clearCookie("sght_session"),clearCookie("sght_csrf")]);return json(res,200,{ok:true});}
   if(path==="/v1/admin/users"&&method==="POST"){
    await checkCsrf();const actor=await requireAdmin(),b=await body(req),email=String(b.email||"").trim().toLowerCase(),role=b.role;
    if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!ROLES.has(role)||typeof b.displayName!=="string"||!b.displayName.trim()||b.displayName.length>120)return json(res,400,{code:"INVALID_INPUT",message:"Invalid invitation details."});
    if(!mailer)return json(res,503,{code:"EMAIL_DELIVERY_UNAVAILABLE",message:"Email delivery is not configured."});
    const rawToken=token(),id=randomUUID();await pool.query("INSERT INTO sght_invitations(id,email_normalized,display_name,role,token_hash,expires_at,created_by) VALUES($1,$2,$3,$4,$5,now()+interval '24 hours',$6)",[id,email,b.displayName.trim(),role,hash(rawToken),actor.user_id]);
    try{await mailer.sendInvitation({to:email,displayName:b.displayName.trim(),role,token:rawToken});}catch{await pool.query("DELETE FROM sght_invitations WHERE id=$1 AND consumed_at IS NULL",[id]);return json(res,502,{code:"EMAIL_DELIVERY_FAILED",message:"Invitation email could not be delivered. No invitation remains active."});}
    await pool.query("INSERT INTO sght_audit_events(actor_user_id,action,metadata_json,request_id) VALUES($1,'user.invite',$2,$3)",[actor.user_id,JSON.stringify({email,role,invitationId:id}),requestId]);
    return json(res,201,{invitationId:id,email,role,status:"sent"});
   }
   if(method==="POST"&&path==="/v1/auth/email-verification/request"){
    await checkCsrf();const b=await body(req),email=String(b.email||"").trim().toLowerCase();
    if(email.length<=254&&/^\S+@\S+\.\S+$/.test(email)&&rateLimit("verify:"+email)&&mailer){const q=await pool.query("SELECT id,email_normalized,display_name FROM sght_users WHERE email_normalized=$1 AND status='active' AND email_verified_at IS NULL",[email]);
     if(q.rowCount){const rawToken=token(),verificationId=randomUUID();await pool.query("INSERT INTO sght_email_verifications(id,token_hash,user_id,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')",[verificationId,hash(rawToken),q.rows[0].id]);
      try{await mailer.sendEmailVerification({to:q.rows[0].email_normalized,displayName:q.rows[0].display_name,token:rawToken});}catch{await pool.query("DELETE FROM sght_email_verifications WHERE id=$1 AND consumed_at IS NULL",[verificationId]);}}}
    return json(res,200,{ok:true,message:"If the account needs verification, instructions will be sent."});
   }
   if(method==="POST"&&path==="/v1/auth/email-verification/complete"){
    await checkCsrf();const b=await body(req),raw=String(b.token||"");if(raw.length<32||raw.length>128)return json(res,400,{code:"INVALID_INPUT",message:"A valid verification token is required."});
    const client=await pool.connect();try{await client.query("BEGIN");const q=await client.query("SELECT id,user_id FROM sght_email_verifications WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",[hash(raw)]);if(!q.rowCount){await client.query("ROLLBACK");return json(res,400,{code:"VERIFICATION_INVALID",message:"Verification token is invalid or expired."});}
    const v=q.rows[0];await client.query("UPDATE sght_users SET email_verified_at=now(),updated_at=now() WHERE id=$1 AND status='active'",[v.user_id]);await client.query("UPDATE sght_email_verifications SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL",[v.user_id]);
    await client.query("INSERT INTO sght_audit_events(target_user_id,action,metadata_json,request_id) VALUES($1,'auth.email_verified',$2,$3)",[v.user_id,JSON.stringify({verificationId:v.id}),requestId]);await client.query("COMMIT");return json(res,200,{ok:true});
    }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
   }
   if(method==="POST"&&path==="/v1/auth/invitations/accept"){
    await checkCsrf();const b=await body(req),raw=String(b.token||"");if(raw.length<32||raw.length>128||!passwordValid(b.password))return json(res,400,{code:"INVALID_INPUT",message:"A valid invitation token and password of 12–256 characters are required."});
    const client=await pool.connect();try{await client.query("BEGIN");const q=await client.query("SELECT * FROM sght_invitations WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",[hash(raw)]);if(!q.rowCount){await client.query("ROLLBACK");return json(res,400,{code:"INVITATION_INVALID",message:"Invitation is invalid or expired."});}const inv=q.rows[0],exists=await client.query("SELECT 1 FROM sght_users WHERE email_normalized=$1",[inv.email_normalized]);if(exists.rowCount){await client.query("ROLLBACK");return json(res,409,{code:"ACCOUNT_EXISTS",message:"An account already exists for this invitation."});}const pw=await passwordHash(b.password),userId=randomUUID();await client.query("INSERT INTO sght_users(id,email_normalized,display_name,password_hash,password_salt,role,status,email_verified_at) VALUES($1,$2,$3,$4,$5,$6,'active',now())",[userId,inv.email_normalized,inv.display_name,pw.hash,pw.salt,inv.role]);await client.query("UPDATE sght_invitations SET consumed_at=now() WHERE id=$1",[inv.id]);await client.query("INSERT INTO sght_audit_events(target_user_id,action,metadata_json,request_id) VALUES($1,'user.invitation.accepted',$2,$3)",[userId,JSON.stringify({invitationId:inv.id}),requestId]);await client.query("COMMIT");return json(res,201,{user:{id:userId,email:inv.email_normalized,displayName:inv.display_name,role:inv.role,status:"active"}});}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
   }
   if(method==="POST"&&path==="/v1/auth/password-reset/request"){
    const q=await pool.query("SELECT id,email_normalized,display_name FROM sght_users WHERE email_normalized=$1 AND status='active' AND email_verified_at IS NOT NULL",[email]);
    if(q.rowCount&&mailer){const rawToken=token(),resetId=randomUUID();await pool.query("INSERT INTO sght_password_resets(id,token_hash,user_id,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')",[resetId,hash(rawToken),q.rows[0].id]);try{await mailer.sendPasswordReset({to:q.rows[0].email_normalized,displayName:q.rows[0].display_name,token:rawToken});}catch{await pool.query("DELETE FROM sght_password_resets WHERE id=$1 AND consumed_at IS NULL",[resetId]);}}
    return json(res,200,{ok:true,message:"If the account is eligible, reset instructions will be sent."});
   }
   if(method==="POST"&&path==="/v1/auth/password-reset/complete"){
    await checkCsrf();const b=await body(req),raw=String(b.token||"");if(raw.length<32||raw.length>128||!passwordValid(b.password))return json(res,400,{code:"INVALID_INPUT",message:"A valid reset token and password of 12–256 characters are required."});const client=await pool.connect();try{await client.query("BEGIN");const q=await client.query("SELECT id,user_id FROM sght_password_resets WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",[hash(raw)]);if(!q.rowCount){await client.query("ROLLBACK");return json(res,400,{code:"RESET_INVALID",message:"Reset token is invalid or expired."});}const reset=q.rows[0],pw=await passwordHash(b.password);await client.query("UPDATE sght_users SET password_hash=$2,password_salt=$3,updated_at=now() WHERE id=$1",[reset.user_id,pw.hash,pw.salt]);await client.query("UPDATE sght_password_resets SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL",[reset.user_id]);await client.query("UPDATE sght_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",[reset.user_id]);await client.query("INSERT INTO sght_audit_events(target_user_id,action,metadata_json,request_id) VALUES($1,'auth.password_reset',$2,$3)",[reset.user_id,JSON.stringify({resetId:reset.id}),requestId]);await client.query("COMMIT");return json(res,200,{ok:true});}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
   }
   if(method==="GET"&&path==="/v1/auth/sessions"){const u=await requireUser();await pool.query("UPDATE sght_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL AND (expires_at<=now() OR last_seen_at<=now()-interval '30 minutes')",[u.user_id]);const q=await pool.query("SELECT public_id AS id,created_at AS \"createdAt\",last_seen_at AS \"lastSeenAt\",expires_at AS \"expiresAt\",public_id=$2 AS current,user_agent AS \"userAgent\" FROM sght_sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>now() AND last_seen_at>now()-interval '30 minutes' ORDER BY created_at DESC",[u.user_id,u.public_id]);const sessions=q.rows.map(s=>({id:s.id,createdAt:s.createdAt,lastSeenAt:s.lastSeenAt,expiresAt:s.expiresAt,current:s.current,device:describeDevice(s.userAgent),deviceChanged:!!s.current&&hasUserAgentChanged(s.userAgent,req.headers["user-agent"])}));return json(res,200,{sessions,policy:{idleMinutes:SESSION_IDLE_TTL_MS/60000,absoluteHours:SESSION_ABSOLUTE_TTL_MS/3600000}});}
   const sessionMatch=path.match(/^\/v1\/auth\/sessions\/([0-9a-f-]{36})$/i);
   if(sessionMatch&&method==="DELETE"){await checkCsrf();const u=await requireUser();const q=await pool.query("UPDATE sght_sessions SET revoked_at=now() WHERE public_id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING public_id",[sessionMatch[1],u.user_id]);if(!q.rowCount)return json(res,404,{code:"SESSION_NOT_FOUND",message:"Session not found."});return json(res,200,{ok:true,revoked:true,current:sessionMatch[1]===u.public_id});}
   if(path==="/v1/admin/users"&&method==="GET"){await requireAdmin();const q=await pool.query("SELECT id,email_normalized AS email,display_name AS \"displayName\",role,status,created_at AS \"createdAt\" FROM sght_users ORDER BY created_at DESC LIMIT 500");return json(res,200,{users:q.rows});}
   const match=path.match(/^\/v1\/admin\/users\/([A-Za-z0-9_-]{8,128})$/);
   if(match&&method==="PATCH"){await checkCsrf();const actor=await requireAdmin(),b=await body(req);if((b.role!==undefined&&!ROLES.has(b.role))||(b.status!==undefined&&!["active","disabled"].includes(b.status))||(!b.role&&!b.status))return json(res,400,{code:"INVALID_INPUT",message:"Invalid role or status."});
    const client=await pool.connect();try{await client.query("BEGIN");const q=await client.query("SELECT id,role,status FROM sght_users WHERE id=$1 FOR UPDATE",[match[1]]);if(!q.rowCount){await client.query("ROLLBACK");return json(res,404,{code:"USER_NOT_FOUND",message:"User not found."});}const old=q.rows[0],nextRole=b.role??old.role,nextStatus=b.status??old.status;if(old.role==="admin"&&(nextRole!=="admin"||nextStatus!=="active")){const n=await client.query("SELECT count(*)::int AS n FROM sght_users WHERE role='admin' AND status='active'");if(n.rows[0].n<=1){await client.query("ROLLBACK");return json(res,409,{code:"LAST_ADMIN",message:"Cannot disable or demote the last active administrator."});}}
    await client.query("UPDATE sght_users SET role=$2,status=$3,updated_at=now() WHERE id=$1",[match[1],nextRole,nextStatus]);await client.query("UPDATE sght_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",[match[1]]);await client.query("INSERT INTO sght_audit_events(actor_user_id,target_user_id,action,metadata_json,request_id) VALUES($1,$2,'user.update',$3,$4)",[actor.user_id,match[1],JSON.stringify({role:nextRole,status:nextStatus}),requestId]);await client.query("COMMIT");return json(res,200,{id:match[1],role:nextRole,status:nextStatus});}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}}
   if(path==="/v1/admin/audit"&&method==="GET"){await requireAdmin();const q=await pool.query("SELECT id,actor_user_id AS \"actorUserId\",target_user_id AS \"targetUserId\",action,metadata_json AS metadata, created_at AS \"createdAt\",request_id AS \"requestId\" FROM sght_audit_events ORDER BY created_at DESC LIMIT 500");return json(res,200,{events:q.rows});}
   return json(res,404,{code:"NOT_FOUND",message:"Route not found."});
  }catch(e){return json(res,e.status||500,{code:e.code||"INTERNAL_ERROR",message:e.status?e.message:"Internal server error.",requestId});}
 });
 return app;
}
export function createPool(connectionString){return new Pool({connectionString,ssl:{rejectUnauthorized:true},max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:5000});}
