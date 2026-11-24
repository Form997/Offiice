import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve("calc");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = resolve(root, relative);
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

let browser;
try {
  await new Promise((resolveReady, reject) => {
    server.once("error", reject);
    server.listen(4173, "127.0.0.1", resolveReady);
  });
  browser = await chromium.launch({ headless: true });
  const checks = [
    { name: "desktop Chromium loads CALC without uncaught page errors", viewport: { width: 1365, height: 900 } },
    { name: "mobile Chromium viewport loads CALC and keeps the sheet workspace present", viewport: { width: 390, height: 844 }, mobile: true }
  ];
  for (const check of checks) {
    const context = await browser.newContext({
      viewport: check.viewport,
      isMobile: Boolean(check.mobile),
      hasTouch: Boolean(check.mobile),
      serviceWorkers: "block"
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle", timeout: 30000 });
    await page.locator("#sheetGrid").waitFor({ state: "attached", timeout: 15000 });
    await page.locator("#formulaInput").waitFor({ state: "attached", timeout: 15000 });
    await page.locator("#sheetScroll").waitFor({ state: "attached", timeout: 15000 });
    if (errors.length) throw new Error(check.name + ": " + errors.join(" | "));
    const title = await page.title();
    if (!title.includes("CALC")) throw new Error(check.name + ": unexpected document title: " + title);
    console.log("PASS " + check.name);
    await context.close();
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
