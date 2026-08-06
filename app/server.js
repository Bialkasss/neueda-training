#!/usr/bin/env node
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3901;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");

/** @type {{ id:number, desk:string, message:string, status:string, createdAt:string }[]} */
let alerts = [
  { id: 1, desk: "Payments-A", message: "Card auth spike — watch queue depth", status: "open", createdAt: "2026-03-10T08:12:00Z" },
  { id: 2, desk: "FX-Floor", message: "Rate feed lag > 2s on EU book", status: "acked", createdAt: "2026-03-10T08:40:00Z" },
  { id: 3, desk: "Ops-Night", message: "Printer jam on floor 12 — escalation pending", status: "open", createdAt: "2026-03-10T09:05:00Z" },
];
let nextId = 4;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload = Buffer.isBuffer(body) || typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(null);
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) return send(res, 403, { error: "forbidden" });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return send(res, 404, { error: "not found" });
  }
  const ext = path.extname(file);
  send(res, 200, fs.readFileSync(file), MIME[ext] || "application/octet-stream");
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || "").split("?")[0];
  if (req.method === "OPTIONS") return send(res, 204, "");

  if (req.method === "GET" && url === "/api/health") {
    return send(res, 200, { ok: true, service: "desknotify-live", alerts: alerts.length });
  }

  if (req.method === "GET" && url === "/api/alerts") {
    return send(res, 200, { alerts });
  }

  // Round-1 Bravo will extend POST /api/alerts here.
  if (req.method === "POST" && url === "/api/alerts") {
    return send(res, 501, { error: "not implemented — Track Bravo" });
  }

  if (url.startsWith("/api/")) return send(res, 404, { error: "unknown api route" });
  return serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`DeskNotify Live → http://127.0.0.1:${PORT}/`);
});
