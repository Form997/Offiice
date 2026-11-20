import { createServer } from "node:http";
import { randomBytes, randomUUID, createHash, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Pool } from "pg";
const scrypt = promisify(scryptCb);
const ROLES = new Set(["admin","signer","auditor","viewer"]);
const SESSION_TTL = 8 * 60 * 60 * 1000;
const hash = value => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const cookie = (name,value,age) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const clearCookie = name => `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
const json = (res,status,data,headers={}) => { res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",...headers});res.end(JSON.stringify(data)); };
const safeUser = u => ({id:u.id,email:u.email,displayName:u.display_name,role:u.role,status:u.status});
function cookies(req){return Object.fromEntries((req.headers.cookie||"").split(";").map(x=>x.trim().split(/=(.*)/s)).filter(x=>x.length===2));}
async function body(req){let s="";for await(const chunk of req){s+=chunk;if(s.length>16384)throw Object.assign(new Error("Body too large"),{status:413,code:"BODY_TOO_LARGE"});}try{return s?JSON.parse(s):{};}catch{throw Object.assign(new Error("Invalid JSON"),{status:400,code:"INVALID_JSON"});}}
function passwordValid(p){return typeof p==="string"&&p.length>=12&&p.length<=256;}
async function passwordHash(password,salt= randomBytes(16).toString("hex")){const key=await scrypt(password,salt,64);return {salt,hash:key.toString("hex")};}
function same(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export function createSghtAuthServer({pool,allowedOrigin,secureCookies=true,now=()=>Date.now()}){
 if(!pool||!allowedOrigin)throw new Error("pool and allowedOrigin are required");
 const originUrl=new URL(allowedOrigin);if(secureCookies&&originUrl.protocol!=="https:")throw new Error("HTTPS origin required");
 const cookieOpts=secureCookies;\n const attempts=new Map();\n const rateLimit=(key)=>{const t=now(),entry=attempts.get(key)||{start:t,count:0};if(t-entry.start>60000){entry.start=t;entry.count=0;}entry.count++;attempts.set(key,entry);return entry.count<=12;};
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
   const checkCsrf=()=>{if(req.headers.origin!==allowedOrigin)throw Object.assign(new Error("Origin rejected"),{status:403,code:"ORIGIN_DENIED"});const c=jar.sght_csrf,h=req.headers["x-csrf-token"];if(!c||!h||!same(c,h))throw Object.assign(new Error("CSRF rejected"),{status:403,code:"CSRF_INVALID"});};
   const session=async()=>{const raw=jar.sght_session;if(!raw)return null;const q=await pool.query("SELECT s.id_hash,s.user_id,u.email,u.display_name,u.role,u.status,s.expires_at FROM sght_sessions s JOIN sght_users u ON u.id=s.user_id WHERE s.id_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now()",[hash(raw)]);if(!q.rowCount)return null;const u=q.rows[0];if(u.status!=="active"){await pool.query("UPDATE sght_sessions SET revoked_at=now() WHERE id_hash=$1",[u.id_hash]);return null;}return u;};
   const requireUser=async()=>{const u=await session();if(!u)throw Object.assign(new Error("Authentication required"),{status:401,code:"UNAUTHENTICATED"});return u;};
   const requireAdmin=async()=>{const u=await requireUser();if(u.role!=="admin")throw Object.assign(new Error("Forbidden"),{status:403,code:"FORBIDDEN"});return u;};
   if(method==="GET"&&path==="/v1/auth/csrf"){const csrf=issueCsrf();return json(res,200,{csrfToken:csrf});}
   if(method==="POST"&&path==="/v1/auth/login"){
    checkCsrf();const b=await body(req),email=String(b.email||"").trim().toLowerCase();
    if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof b.password!=="string")return json(res,400,{code:"INVALID_INPUT",message:"Invalid login input."});
    const q=await pool.query("SELECT * FROM sght_users WHERE email_normalized=$1",[email]);const u=q.rows[0];
    const fallback=await passwordHash("not-a-real-password-value");const salt=u?.password_salt||fallback.salt;
    const candidate=(await passwordHash(b.password,salt)).hash;
    if(!u||u.status!=="active"||!same(candidate,u.password_hash))return json(res,401,{code:"INVALID_CREDENTIALS",message:"Email or password is incorrect."});
    const sid=token(),csrf=issueCsrf();await pool.query("INSERT INTO sght_sessions(id_hash,user_id,csrf_hash,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')",[hash(sid),u.id,hash(csrf)]);
    res.setHeader("Set-Cookie",[cookie("sght_session",sid,28800),`sght_csrf=${csrf}; Path=/; SameSite=Strict; Max-Age=1800${cookieOpts?"; Secure":""}`]);
    await pool.query("INSERT INTO sght_audit_events(actor_user_id,target_user_id,action,metadata_json,request_id) VALUES($1,$1,'auth.login','{}',$2)",[u.id,requestId]);
    return json(res,200,{user:safeUser(u)});
   }
   if(method==="GET"&&path==="/v1/auth/me"){const u=await requireUser();return json(res,200,{user:safeUser(u)});}
   if(method==="POST"&&path==="/v1/auth/logout"){checkCsrf();const raw=jar.sght_session;if(raw)await pool.query("UPDATE sght_sessions SET revoked_at=now() WHERE id_hash=$1 AND revoked_at IS NULL",[hash(raw)]);res.setHeader("Set-Cookie",[clearCookie("sght_session"),clearCookie("sght_csrf")]);return json(res,200,{ok:true});}
   if(path==="/v1/admin/users"&&method==="POST"){
    checkCsrf();const actor=await requireAdmin(),b=await body(req),email=String(b.email||"").trim().toLowerCase(),role=b.role;
    if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!ROLES.has(role)||typeof b.displayName!=="string"||b.displayName.length>120)return json(res,400,{code:"INVALID_INPUT",message:"Invalid invitation details."});
    const id=randomUUID();await pool.query("INSERT INTO sght_invitations(id,email_normalized,display_name,role,expires_at,created_by) VALUES($1,$2,$3,$4,now()+interval '24 hours',$5)",[id,email,b.displayName,role,actor.user_id]);
    await pool.query("INSERT INTO sght_audit_events(actor_user_id,action,metadata_json,request_id) VALUES($1,'user.invite',$2,$3)",[actor.user_id,JSON.stringify({email,role}),requestId]);
    return json(res,201,{invitationId:id,email,role,status:"pending"});
   }
   if(path==="/v1/admin/users"&&method==="GET"){await requireAdmin();const q=await pool.query("SELECT id,email_normalized AS email,display_name AS \"displayName\",role,status,created_at AS \"createdAt\" FROM sght_users ORDER BY created_at DESC LIMIT 500");return json(res,200,{users:q.rows});}
   const match=path.match(/^\/v1\/admin\/users\/([A-Za-z0-9_-]{8,128})$/);
   if(match&&method==="PATCH"){checkCsrf();const actor=await requireAdmin(),b=await body(req);if((b.role!==undefined&&!ROLES.has(b.role))||(b.status!==undefined&&!["active","disabled"].includes(b.status))||(!b.role&&!b.status))return json(res,400,{code:"INVALID_INPUT",message:"Invalid role or status."});
    const client=await pool.connect();try{await client.query("BEGIN");const q=await client.query("SELECT id,role,status FROM sght_users WHERE id=$1 FOR UPDATE",[match[1]]);if(!q.rowCount){await client.query("ROLLBACK");return json(res,404,{code:"USER_NOT_FOUND",message:"User not found."});}const old=q.rows[0],nextRole=b.role??old.role,nextStatus=b.status??old.status;if(old.role==="admin"&&(nextRole!=="admin"||nextStatus!=="active")){const n=await client.query("SELECT count(*)::int AS n FROM sght_users WHERE role='admin' AND status='active'");if(n.rows[0].n<=1){await client.query("ROLLBACK");return json(res,409,{code:"LAST_ADMIN",message:"Cannot disable or demote the last active administrator."});}}
    await client.query("UPDATE sght_users SET role=$2,status=$3,updated_at=now() WHERE id=$1",[match[1],nextRole,nextStatus]);await client.query("UPDATE sght_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",[match[1]]);await client.query("INSERT INTO sght_audit_events(actor_user_id,target_user_id,action,metadata_json,request_id) VALUES($1,$2,'user.update',$3,$4)",[actor.user_id,match[1],JSON.stringify({role:nextRole,status:nextStatus}),requestId]);await client.query("COMMIT");return json(res,200,{id:match[1],role:nextRole,status:nextStatus});}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}}
   if(path==="/v1/admin/audit"&&method==="GET"){await requireAdmin();const q=await pool.query("SELECT id,actor_user_id AS \"actorUserId\",target_user_id AS \"targetUserId\",action,metadata_json AS metadata, created_at AS \"createdAt\",request_id AS \"requestId\" FROM sght_audit_events ORDER BY created_at DESC LIMIT 500");return json(res,200,{events:q.rows});}
   return json(res,404,{code:"NOT_FOUND",message:"Route not found."});
  }catch(e){return json(res,e.status||500,{code:e.code||"INTERNAL_ERROR",message:e.status?e.message:"Internal server error.",requestId});}
 });
 return app;
}
export function createPool(connectionString){return new Pool({connectionString,ssl:{rejectUnauthorized:true},max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:5000});}
