/** Server-backed SGHT authentication client.
 * Session credentials remain in HttpOnly cookies owned by the API server.
 * No bearer token, password, role, or session identifier is persisted locally.
 */
export class AuthApiError extends Error {
  constructor(message, status = 0, code = "AUTH_API_ERROR") {
    super(message); this.name = "AuthApiError"; this.status = status; this.code = code;
  }
}
export function resolveAuthApiBase(value, origin = globalThis.location?.origin || "") {
  if (!value) return null;
  let url;
  try { url = origin ? new URL(value, origin) : new URL(value); }
  catch { throw new AuthApiError("Địa chỉ máy chủ xác thực không hợp lệ."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !local) throw new AuthApiError("Máy chủ xác thực phải dùng HTTPS.");
  if (url.username || url.password || url.hash || url.search) throw new AuthApiError("URL máy chủ không được chứa thông tin đăng nhập, query hoặc fragment.");
  return url.href.replace(/\/$/, "");
}
const SAFE_PATHS = new Set([
  "/v1/auth/csrf", "/v1/auth/login", "/v1/auth/me", "/v1/auth/logout",
  "/v1/auth/email-verification/request", "/v1/auth/email-verification/complete",
  "/v1/auth/invitations/accept", "/v1/auth/password-reset/request", "/v1/auth/password-reset/complete",
  "/v1/admin/users", "/v1/admin/audit", "/v1/auth/sessions"
]);
function allowedPath(path) {
  return SAFE_PATHS.has(path) || /^\/v1\/admin\/users\/[A-Za-z0-9_-]{8,128}$/.test(path) || /^\/v1\/auth\/sessions\/[0-9a-f-]{36}$/i.test(path);
}
export class SghtAuthApiClient {
  constructor({ baseUrl, fetchImpl = globalThis.fetch, csrfHeader = "X-CSRF-Token", timeoutMs = 15000 } = {}) {
    this.baseUrl = resolveAuthApiBase(baseUrl); this.fetchImpl = fetchImpl;
    this.csrfHeader = csrfHeader; this.timeoutMs = Math.max(1000, Math.min(60000, Number(timeoutMs) || 15000));
    this.csrfToken = null; this.inFlightCsrf = null;
    if (!this.baseUrl) throw new AuthApiError("Chưa cấu hình máy chủ xác thực SGHT.", 0, "AUTH_API_NOT_CONFIGURED");
    if (typeof fetchImpl !== "function") throw new AuthApiError("Trình duyệt không hỗ trợ fetch.");
  }
  clearSessionHints() { this.csrfToken = null; }
  async getCsrfToken() {
    if (this.csrfToken) return this.csrfToken;
    if (!this.inFlightCsrf) this.inFlightCsrf = (async () => {
      const data = await this.send("/v1/auth/csrf", { method: "GET" });
      if (typeof data.csrfToken !== "string" || data.csrfToken.length < 16 || data.csrfToken.length > 4096)
        throw new AuthApiError("Máy chủ cấp CSRF token không hợp lệ.", 0, "CSRF_MISSING");
      this.csrfToken = data.csrfToken; return this.csrfToken;
    })().finally(() => { this.inFlightCsrf = null; });
    return this.inFlightCsrf;
  }
  async send(path, { method = "GET", body, csrfToken } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (csrfToken) headers[this.csrfHeader] = csrfToken;
    try {
      const response = await this.fetchImpl(this.baseUrl + path, {
        method, credentials: "include", headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store", redirect: "error", signal: controller.signal
      });
      let data = {};
      try { data = await response.json(); } catch {
        if (response.ok) throw new AuthApiError("Máy chủ trả về JSON không hợp lệ.", response.status, "INVALID_RESPONSE");
      }
      if (!response.ok) {
        if (response.status === 401) this.clearSessionHints();
        throw new AuthApiError(data.message || "Yêu cầu xác thực bị từ chối.", response.status, data.code || "AUTH_API_ERROR");
      }
      return data && typeof data === "object" ? data : {};
    } catch (error) {
      if (error instanceof AuthApiError) throw error;
      if (error?.name === "AbortError") throw new AuthApiError("Máy chủ xác thực phản hồi quá thời hạn.", 0, "AUTH_TIMEOUT");
      throw new AuthApiError("Không thể kết nối máy chủ xác thực.", 0, "AUTH_NETWORK_ERROR");
    } finally { clearTimeout(timeout); }
  }
  async request(path, { method = "GET", body, csrf = false } = {}) {
    if (!allowedPath(path)) throw new AuthApiError("Đường dẫn API không nằm trong danh sách cho phép.");
    const upper = method.toUpperCase();
    if (!["GET", "POST", "PATCH", "DELETE"].includes(upper) || (upper === "DELETE" && !path.startsWith("/v1/auth/sessions/"))) throw new AuthApiError("Phương thức API không được hỗ trợ.");
    if (csrf && !["POST", "PATCH", "DELETE"].includes(upper)) throw new AuthApiError("CSRF chỉ dùng cho yêu cầu thay đổi dữ liệu.");
    let token = csrf ? await this.getCsrfToken() : null;
    try { return await this.send(path, { method: upper, body, csrfToken: token }); }
    catch (error) {
      // Retry once only for an explicit CSRF rejection. Server contract must reject
      // invalid CSRF before performing any mutation; never retry generic 403 errors.
      if (!csrf || error.status !== 403 || !["CSRF_INVALID", "CSRF_EXPIRED"].includes(error.code)) throw error;
      this.clearSessionHints(); token = await this.getCsrfToken();
      return this.send(path, { method: upper, body, csrfToken: token });
    }
  }
  async login({ email, password }) {
    if (!email || !password) throw new AuthApiError("Cần email và mật khẩu.");
    return safeSession(await this.request("/v1/auth/login", { method: "POST", body: { email: String(email).trim().toLowerCase(), password }, csrf: true }));
  }
  async me() { return safeSession(await this.request("/v1/auth/me")); }
  async logout() { try { return await this.request("/v1/auth/logout", { method: "POST", body: {}, csrf: true }); } finally { this.clearSessionHints(); } }
  async createUser({ email, displayName, role }) { return this.request("/v1/admin/users", { method: "POST", body: { email, displayName, role }, csrf: true }); }
  async listUsers() { return this.request("/v1/admin/users"); }
  async updateUser(userId, { role, status }) {
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(userId || "")) throw new AuthApiError("Mã tài khoản không hợp lệ.");
    return this.request("/v1/admin/users/" + encodeURIComponent(userId), { method: "PATCH", body: { role, status }, csrf: true });
  }
  async audit() { return this.request("/v1/admin/audit"); }
  async requestEmailVerification(email) { return this.request("/v1/auth/email-verification/request", { method: "POST", body: { email }, csrf: true }); }
  async completeEmailVerification(token) { return this.request("/v1/auth/email-verification/complete", { method: "POST", body: { token }, csrf: true }); }
  async acceptInvitation(token, password) { return this.request("/v1/auth/invitations/accept", { method: "POST", body: { token, password }, csrf: true }); }
  async requestPasswordReset(email) { return this.request("/v1/auth/password-reset/request", { method: "POST", body: { email }, csrf: true }); }
  async completePasswordReset(token, password) { return this.request("/v1/auth/password-reset/complete", { method: "POST", body: { token, password }, csrf: true }); }
  async listSessions() { return this.request("/v1/auth/sessions"); }
  async revokeSession(sessionId) { if (!/^[0-9a-f-]{36}$/i.test(sessionId || "")) throw new AuthApiError("Mã phiên không hợp lệ."); return this.request("/v1/auth/sessions/" + encodeURIComponent(sessionId), { method: "DELETE", csrf: true }); }
}
function safeSession(data) {
  const u = data.user || data;
  if (!u || typeof u.id !== "string" || typeof u.email !== "string" || typeof u.role !== "string" ||
      !["admin", "signer", "auditor", "viewer"].includes(u.role) || (u.status && !["active", "disabled"].includes(u.status)))
    throw new AuthApiError("Phản hồi phiên từ máy chủ sai cấu trúc.", 0, "INVALID_SESSION");
  if (u.status === "disabled") throw new AuthApiError("Tài khoản đã bị khóa.", 403, "ACCOUNT_DISABLED");
  return { userId: u.id, email: u.email, displayName: String(u.displayName || u.name || u.email), role: u.role, status: u.status || "active" };
}
