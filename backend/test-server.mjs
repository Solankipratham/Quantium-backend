import "dotenv/config";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const app = (await import("./src/app.js")).default;
const server = http.createServer((req, res) => app(req, res));

function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:5001${url}`, { method: opts.method || "GET", headers: { "Content-Type": "application/json", ...opts.headers } }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ url, status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

console.log("JWT_SECRET:", process.env.JWT_SECRET);

async function run() {
  server.listen(5001, async () => {
    try {
      const r1 = await request("/api/health");
      console.log("HEALTH:", r1.status, r1.body);

      const r2 = await request("/api/students/filters");
      console.log("FILTERS (no auth):", r2.status, r2.body);

      const r3 = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@quantum.in", password: "admin123" }) });
      console.log("LOGIN:", r3.status, r3.body);

      let token = null;
      try { token = JSON.parse(r3.body).token; } catch {}

      if (token) {
        const r4 = await request("/api/students/filters", { headers: { "Authorization": `Bearer ${token}` } });
        console.log("FILTERS (with auth):", r4.status, r4.body);

        const r5 = await request("/api/students", { headers: { "Authorization": `Bearer ${token}` } });
        console.log("STUDENTS:", r5.status, r5.body.substring(0, 100));
      }
    } catch (e) {
      console.error("Error:", e.message, e.stack);
    }
    server.close();
  });
}

run();
