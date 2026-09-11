import "dotenv/config";
import http from "http";

const app = (await import("./src/app.js")).default;
const server = http.createServer((req, res) => app(req, res));

function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:5003${url}`, { method: opts.method || "GET", headers: { "Content-Type": "application/json", ...opts.headers } }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ url, status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function run() {
  server.listen(5003, async () => {
    let passed = 0;
    let failed = 0;

    // Test 1: Health check
    try {
      const r = await request("/api/health");
      const body = JSON.parse(r.body);
      if (r.status === 200 && body.success && body.message === "API is running") {
        console.log(`✅ /api/health → 200 ${JSON.stringify(body)}`);
        passed++;
      } else {
        console.log(`❌ /api/health → ${r.status} ${r.body}`);
        failed++;
      }
    } catch (e) { console.log(`❌ /api/health error: ${e.message}`); failed++; }

    // Test 2: Students filters without auth
    try {
      const r = await request("/api/students/filters");
      if (r.status === 401) {
        console.log(`✅ /api/students/filters → 401 (auth required)`);
        passed++;
      } else {
        console.log(`❌ /api/students/filters → ${r.status}`);
        failed++;
      }
    } catch (e) { console.log(`❌ /api/students/filters error: ${e.message}`); failed++; }

    // Test 3: Login
    let token = null;
    try {
      const r = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@quantum.in", password: "admin123" }) });
      const body = JSON.parse(r.body);
      if (r.status === 200 && body.token) {
        console.log(`✅ /api/auth/login → 200 (token received)`);
        passed++;
        token = body.token;
      } else {
        console.log(`❌ /api/auth/login → ${r.status} ${r.body}`);
        failed++;
      }
    } catch (e) { console.log(`❌ /api/auth/login error: ${e.message}`); failed++; }

    // Test 4: Students filters with auth
    if (token) {
      try {
        const r = await request("/api/students/filters", { headers: { "Authorization": `Bearer ${token}` } });
        const body = JSON.parse(r.body);
        if (r.status === 200 && body.success && body.batches && body.courses && body.teachers) {
          console.log(`✅ /api/students/filters (auth) → 200 (batches: ${body.batches.length}, courses: ${body.courses.length}, teachers: ${body.teachers.length})`);
          passed++;
        } else {
          console.log(`❌ /api/students/filters (auth) → ${r.status} ${r.body.substring(0, 100)}`);
          failed++;
        }
      } catch (e) { console.log(`❌ /api/students/filters (auth) error: ${e.message}`); failed++; }
    }

    // Test 5: 404 route
    try {
      const r = await request("/api/nonexistent");
      const body = JSON.parse(r.body);
      if (r.status === 404) {
        console.log(`✅ /api/nonexistent → 404`);
        passed++;
      } else {
        console.log(`❌ /api/nonexistent → ${r.status}`);
        failed++;
      }
    } catch (e) { console.log(`❌ /api/nonexistent error: ${e.message}`); failed++; }

    // Test 6: Protected routes without auth
    try {
      const r = await request("/api/batches");
      if (r.status === 401) {
        console.log(`✅ /api/batches → 401 (auth required)`);
        passed++;
      } else {
        console.log(`❌ /api/batches → ${r.status}`);
        failed++;
      }
    } catch (e) { console.log(`❌ /api/batches error: ${e.message}`); failed++; }

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  });
}

run().catch(e => { console.error(e); process.exit(1); });
