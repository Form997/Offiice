import test from "node:test";
import assert from "node:assert/strict";
import {SghtAuthApiClient,AuthApiError,resolveAuthApiBase} from "../engine/auth-api-client.js";
test("production API URL must use HTTPS and rejects credential-bearing URLs",()=>{assert.throws(()=>resolveAuthApiBase("http://example.com"),/HTTPS/);assert.throws(()=>resolveAuthApiBase("https://user:pass@example.com"),/không được chứa/);assert.equal(resolveAuthApiBase("https://auth.example.com/"),"https://auth.example.com");assert.equal(resolveAuthApiBase("http://localhost:3000"),"http://localhost:3000");});
test("client fails closed when API URL is not configured",()=>{assert.throws(()=>new SghtAuthApiClient({}),e=>e instanceof AuthApiError&&e.code==="AUTH_API_NOT_CONFIGURED");});
test("login fetches CSRF token and uses HttpOnly cookie credentials, never stores token",async()=>{const calls=[],fetchImpl=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/csrf")?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({user:{id:"user_123456",email:"a@b.test",role:"admin",displayName:"Admin"}}),{status:200});};const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});const session=await c.login({email:" A@B.TEST ",password:"secret"});assert.equal(session.role,"admin");assert.equal(calls.length,2);assert.equal(calls[1].opts.credentials,"include");assert.equal(calls[1].opts.headers["X-CSRF-Token"],"csrf-token-value-123");assert.equal(JSON.parse(calls[1].opts.body).email,"a@b.test");assert.equal("password" in session,false);assert.equal("token" in session,false);});
test("admin operations require CSRF and validate user identifier",async()=>{const calls=[],fetchImpl=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/csrf")?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({users:[]}),{status:200});};const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});await c.updateUser("user_123456",{role:"auditor"});assert.equal(calls.at(-1).opts.method,"PATCH");assert.equal(calls.at(-1).opts.headers["X-CSRF-Token"],"csrf-token-value-123");await assert.rejects(()=>c.updateUser("../bad",{role:"admin"}),/Mã tài khoản/);});
test("401 clears cached CSRF token and API errors are surfaced",async()=>{let n=0;const fetchImpl=async()=>{n++;return n===1?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({message:"Unauthenticated",code:"UNAUTHENTICATED"}),{status:401});};const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});await assert.rejects(()=>c.login({email:"user@example.com",password:"password"}),e=>e.status===401);assert.equal(c.csrfToken,null);});
test("rejects unexpected paths and malformed server session",async()=>{const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl:async()=>new Response(JSON.stringify({}),{status:200})});await assert.rejects(()=>c.request("/admin/users"),/Đường dẫn/);await assert.rejects(()=>c.me(),e=>e.code==="INVALID_SESSION");});

test("only explicitly supported API routes and methods are accepted",async()=>{const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl:async()=>new Response(JSON.stringify({}),{status:200})});await assert.rejects(()=>c.request("/v1/admin/users/../../auth/me"),/danh sách/);await assert.rejects(()=>c.request("/v1/auth/me",{method:"DELETE"}),/không được hỗ trợ/);});
test("CSRF rejection refreshes token and retries exactly once",async()=>{let csrf=0,mutation=0;const fetchImpl=async(url,opts)=>{if(url.endsWith("/csrf"))return new Response(JSON.stringify({csrfToken:"csrf-token-value-"+(++csrf)}),{status:200});if(url.endsWith("/login")){mutation++;if(mutation===1)return new Response(JSON.stringify({code:"CSRF_EXPIRED"}),{status:403});return new Response(JSON.stringify({user:{id:"user_123456",email:"a@b.test",role:"viewer"}}),{status:200});}throw new Error("unexpected");};const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});const session=await c.login({email:"a@b.test",password:"secret"});assert.equal(session.role,"viewer");assert.equal(csrf,2);assert.equal(mutation,2);});
test("generic 403 is never retried",async()=>{let calls=0;const fetchImpl=async(url)=>{calls++;return url.endsWith("/csrf")?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({code:"FORBIDDEN"}),{status:403});};const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});await assert.rejects(()=>c.request("/v1/auth/logout",{method:"POST",body:{},csrf:true}),e=>e.status===403&&e.code==="FORBIDDEN");assert.equal(calls,2);});
test("401 invalidates CSRF token and disabled or unknown-role sessions are rejected",async()=>{let calls=0;const fetchImpl=async(url)=>{calls++;if(url.endsWith("/csrf"))return new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200});return new Response(JSON.stringify({code:"UNAUTHENTICATED"}),{status:401});};const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});await assert.rejects(()=>c.request("/v1/auth/logout",{method:"POST",body:{},csrf:true}),e=>e.status===401);assert.equal(c.csrfToken,null);assert.equal(calls,2);});
test("request includes timeout signal and maps network failure to safe error",async()=>{const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl:async(_url,opts)=>{assert.ok(opts.signal instanceof AbortSignal);throw new TypeError("private network detail");}});await assert.rejects(()=>c.me(),e=>e.code==="AUTH_NETWORK_ERROR"&&!e.message.includes("private"));});
test("API base rejects query strings and invalid CSRF tokens",async()=>{assert.throws(()=>resolveAuthApiBase("https://auth.example.com/?token=x"),/query/);const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl:async()=>new Response(JSON.stringify({csrfToken:"x"}),{status:200})});await assert.rejects(()=>c.login({email:"a@b.test",password:"x"}),e=>e.code==="CSRF_MISSING");});

test("account lifecycle and session revocation routes are allowlisted",async()=>{
 const calls=[],fetchImpl=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/csrf")?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({ok:true}),{status:200});};
 const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});
 await c.requestEmailVerification("a@example.test");
 await c.acceptInvitation("invitation-token","long-password-123");
 await c.requestPasswordReset("a@example.test");
 await c.completeEmailVerification("verification-token");
 await c.revokeSession("123e4567-e89b-12d3-a456-426614174000");
 assert.equal(calls.at(-1).opts.method,"DELETE");
 assert.equal(calls.at(-1).opts.headers["X-CSRF-Token"],"csrf-token-value-123");
 await assert.rejects(()=>c.revokeSession("../bad"),/Mã phiên/);
});

test("MFA login challenge is returned without creating a local session",async()=>{
 const fetchImpl=async(url)=>url.endsWith("/csrf")?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({mfaRequired:true,challengeToken:"x".repeat(48),expiresInSeconds:300}),{status:200});
 const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl}),result=await c.login({email:"a@b.test",password:"password"});
 assert.equal(result.mfaRequired,true);assert.equal(result.challengeToken.length,48);assert.equal("role" in result,false);
});
test("MFA methods use allowlisted routes and CSRF headers",async()=>{
 const calls=[],fetchImpl=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/csrf")?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({user:{id:"user_123456",email:"a@b.test",role:"viewer"}}),{status:200});};
 const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});
 await c.completeMfaLogin("x".repeat(48),"123456");await c.enrollMfa();await c.enableMfa("123456");await c.disableMfa("password","123456");
 assert.deepEqual(calls.filter(x=>!x.url.endsWith("/csrf")).map(x=>new URL(x.url).pathname),["/v1/auth/mfa/login/complete","/v1/auth/mfa/enroll","/v1/auth/mfa/enable","/v1/auth/mfa/disable"]);
 assert.ok(calls.filter(x=>!x.url.endsWith("/csrf")).every(x=>x.opts.headers["X-CSRF-Token"]==="csrf-token-value-123"));
});

test("MFA status is fetched through the authenticated allowlisted endpoint",async()=>{
 const calls=[],fetchImpl=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/csrf")?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({enabled:true,recoveryCodesRemaining:7}),{status:200});};
 const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl}),status=await c.mfaStatus();
 assert.equal(status.enabled,true);assert.equal(status.recoveryCodesRemaining,7);assert.equal(new URL(calls[0].url).pathname,"/v1/auth/mfa/status");
});

test("Passkey management allows scoped rename and reauthenticated revocation",async()=>{
 const calls=[],fetchImpl=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/csrf")?new Response(JSON.stringify({csrfToken:"csrf-token-value-123"}),{status:200}):new Response(JSON.stringify({ok:true}),{status:200});};
 const c=new SghtAuthApiClient({baseUrl:"https://auth.example.com",fetchImpl});
 const id="credential_id_0123456789";
 await c.renamePasskey(id,"Máy tính cá nhân");
 await c.deletePasskey(id,"correct horse battery","123456");
 const changes=calls.filter(x=>!x.url.endsWith("/csrf"));
 assert.deepEqual(changes.map(x=>x.opts.method),["PATCH","DELETE"]);
 assert.ok(changes.every(x=>x.opts.headers["X-CSRF-Token"]==="csrf-token-value-123"));
 assert.deepEqual(JSON.parse(changes[0].opts.body),{displayName:"Máy tính cá nhân"});
 assert.deepEqual(JSON.parse(changes[1].opts.body),{password:"correct horse battery",code:"123456"});
 await assert.rejects(()=>c.deletePasskey("../invalid","pw","123456"),/Mã Passkey/);
});
