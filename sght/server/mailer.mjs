const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

export function buildAccountLink(publicAppUrl, kind, rawToken) {
  if (!["invite", "reset"].includes(kind)) throw new TypeError("Unsupported account link type.");
  let url;
  try { url = new URL(publicAppUrl); } catch { throw new Error("SGHT_PUBLIC_APP_URL must be an absolute HTTPS URL."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash)
    throw new Error("SGHT_PUBLIC_APP_URL must be HTTPS and contain no credentials, query, or fragment.");
  const fragment = new URLSearchParams({ [kind]: rawToken }).toString();
  const path = url.pathname.replace(/\/$/, "");
  url.pathname = path.endsWith("/sght") ? path + "/" : path + "/sght/";
  url.hash = fragment;
  return url.href;
}

export function createSghtMailer({ transport, from, publicAppUrl }) {
  if (!transport || typeof transport.sendMail !== "function") throw new TypeError("A mail transport is required.");
  if (!from || !String(from).includes("@")) throw new Error("A valid SGHT_MAIL_FROM address is required.");
  // Validate configuration before accepting requests.
  buildAccountLink(publicAppUrl, "invite", "configuration-check");
  const deliver = async ({ to, subject, text, html }) => {
    await transport.sendMail({ from, to, subject, text, html });
  };
  return Object.freeze({
    async sendInvitation({ to, displayName, role, token }) {
      const link = buildAccountLink(publicAppUrl, "invite", token);
      const name = String(displayName || "bạn");
      const text = `Xin chào ${name},\n\nBạn được mời tham gia SGHT với vai trò ${role}. Mở liên kết sau để xác nhận email và tạo mật khẩu (hết hạn sau 24 giờ):\n${link}\n\nNếu bạn không mong đợi thư này, hãy bỏ qua.\n`;
      const html = `<p>Xin chào ${escapeHtml(name)},</p><p>Bạn được mời tham gia SGHT với vai trò <strong>${escapeHtml(role)}</strong>.</p><p><a href="${escapeHtml(link)}">Xác nhận email và tạo tài khoản</a></p><p>Liên kết hết hạn sau 24 giờ. Nếu bạn không mong đợi thư này, hãy bỏ qua.</p>`;
      await deliver({ to, subject: "Lời mời tham gia SGHT", text, html });
    },
    async sendPasswordReset({ to, displayName, token }) {
      const link = buildAccountLink(publicAppUrl, "reset", token);
      const name = String(displayName || "bạn");
      const text = `Xin chào ${name},\n\nCó yêu cầu đặt lại mật khẩu SGHT cho tài khoản này. Mở liên kết sau trong vòng 30 phút:\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua thư này.\n`;
      const html = `<p>Xin chào ${escapeHtml(name)},</p><p>Có yêu cầu đặt lại mật khẩu SGHT cho tài khoản này.</p><p><a href="${escapeHtml(link)}">Đặt lại mật khẩu</a></p><p>Liên kết hết hạn sau 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua thư này.</p>`;
      await deliver({ to, subject: "Đặt lại mật khẩu SGHT", text, html });
    }
  });
}

export async function createSmtpMailer(env = process.env) {
  const required = ["SMTP_HOST", "SMTP_PORT", "SGHT_MAIL_FROM", "SGHT_PUBLIC_APP_URL"];
  const configured = required.some(key => Boolean(env[key]));
  if (!configured) return null;
  if (required.some(key => !env[key])) throw new Error("SMTP_HOST, SMTP_PORT, SGHT_MAIL_FROM and SGHT_PUBLIC_APP_URL must all be configured.");
  const port = Number(env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT is invalid.");
  const secure = String(env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  const auth = env.SMTP_USER || env.SMTP_PASSWORD ? { user: env.SMTP_USER || "", pass: env.SMTP_PASSWORD || "" } : undefined;
  if (auth && (!auth.user || !auth.pass)) throw new Error("Both SMTP_USER and SMTP_PASSWORD are required when SMTP authentication is enabled.");
  const nodemailerModule = await import("nodemailer");
  const nodemailer = nodemailerModule.default || nodemailerModule;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST, port, secure, auth,
    requireTLS: !secure, tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    disableFileAccess: true, disableUrlAccess: true
  });
  return createSghtMailer({ transport, from: env.SGHT_MAIL_FROM, publicAppUrl: env.SGHT_PUBLIC_APP_URL });
}
