/** Server-backed SGHT authentication client.
 * Session credentials remain in HttpOnly cookies owned by the API server.
 * This module deliberately never persists access tokens or roles locally.
 */
export class AuthApiError extends Error{constructor(message,status=0,code="AUTH_API_ERROR"){super(message);this.name="AuthApiError";this.status=status;this.code=code;}}
export function resolveAuthApiBase(value,origin=globalThis.location?.origin||""){if(!value)return null;let url;try{url=new URL(value,origin);}catch{throw new AuthApiError("Địa chỉ máy chủ xác thực không hợp lệ.");}const local=["localhost","127.0.0.1","[::1]"].includes(url.hostname);if(url.protocol!=="https:"&&!local)throw new AuthApiError("Máy chủ xác thực phải dùng HTTPS.");if(url.username||url.password||url.hash)throw new AuthApiError("URL máy chủ không được chứa thông tin đăng nhập hoặc fragment.");return url.href.replace(/\/$/,"");}
export class SghtAuthApiClient{
 constructor({baseUrl,fetchImpl=globalThis.fetch,csrfHeader="X-CSRF-Token"}={}){this.baseUrl=resolveAuthApiBase(baseUrl);this.fetchImpl=fetchImpl;this.csrfHeader=csrfHeader;this.csrfToken=null;if(!this.baseUrl)throw new AuthApiError("Chưa cấu hình máy chủ xác thực SGHT.",0,"AUTH_API_NOT_CONFIGURED");if(typeof fetchImpl!=="function")throw new AuthApiError("Trình duyệt không hỗ trợ fetch.");}
 async request(path,{method="GET",body,csrf=false}={}){if(!path.startsWith("/v1/")||path.startsWith("//"))throw new AuthApiError("Đường dẫn API không hợp lệ.");if(csrf&&!this.csrfToken){const r=await this.fetchImpl(this.baseUrl+"/v1/auth/csrf",{method:"GET",credentials:"include",headers:{Accept:"application/json"}});const d=await read(r);if(!d.csrfToken)throw new AuthApiError("Máy chủ không cấp CSRF token.",r.status,"CSRF_MISSING");this.csrfToken=d.csrfToken;}
 const headers={Accept:"application/json"};if(body!==undefined)headers["Content-Type"]="application/json";if(csrf)headers[this.csrfHeader]=this.csrfToken;
 const response=await this.fetchImpl(this.baseUrl+path,{method,credentials:"include",headers,body:body===undefined?undefined:JSON.stringify(body),cache:"no-store",redirect:"error"});const data=await read(response);if(!response.ok){if(response.status===401)this.csrfToken=null;throw new AuthApiError(data.message||"Yêu cầu xác thực bị từ chối.",response.status,data.code||"AUTH_API_ERROR");}return data;}
 async login({email,password}){if(!email||!password)throw new AuthApiError("Cần email và mật khẩu.");const result=await this.request("/v1/auth/login",{method:"POST",body:{email:String(email).trim().toLowerCase(),password},csrf:true});return safeSession(result);}
 async me(){return safeSession(await this.request("/v1/auth/me"));}
 async logout(){try{return await this.request("/v1/auth/logout",{method:"POST",body:{},csrf:true});}finally{this.csrfToken=null;}}
 async createUser({email,displayName,role}){return this.request("/v1/admin/users",{method:"POST",body:{email,displayName,role},csrf:true});}
 async listUsers(){return this.request("/v1/admin/users");}
 async updateUser(userId,{role,status}){if(!/^[A-Za-z0-9_-]{8,128}$/.test(userId||""))throw new AuthApiError("Mã tài khoản không hợp lệ.");return this.request("/v1/admin/users/"+encodeURIComponent(userId),{method:"PATCH",body:{role,status},csrf:true});}
 async audit(){return this.request("/v1/admin/audit");}
}
async function read(response){let data={};try{data=await response.json();}catch{}return data&&typeof data==="object"?data:{};}
function safeSession(data){const u=data.user||data;if(!u||typeof u.id!=="string"||typeof u.email!=="string"||typeof u.role!=="string")throw new AuthApiError("Phản hồi phiên từ máy chủ sai cấu trúc.",0,"INVALID_SESSION");return {userId:u.id,email:u.email,displayName:String(u.displayName||u.name||u.email),role:u.role,status:u.status||"active"};}
