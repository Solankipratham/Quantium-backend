import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const files = [
  "src/app.js",
  "src/server.js",
  "src/middleware/error.js",
  "src/middleware/auth.js",
  "src/data/store.js",
  "src/data/supabaseStore.js",
  "src/lib/supabase.js",
  "src/routes/students.js",
  "src/routes/auth.js",
  "src/routes/batches.js",
  "src/routes/courses.js",
  "src/routes/fees.js",
  "src/routes/expenses.js",
  "src/routes/payments.js",
  "src/routes/settings.js",
  "src/routes/reports.js",
  "src/routes/dashboard.js",
  "src/routes/notifications.js",
  "src/routes/auditLogs.js",
];

let allOk = true;
for (const f of files) {
  try {
    const result = execSync(`node --check ${f}`, { cwd: process.cwd(), encoding: "utf8" });
    console.log(`OK: ${f}`);
  } catch (e) {
    console.error(`ERROR: ${f} - ${e.message.split("\n")[0]}`);
    allOk = false;
  }
}

// Also check the Vercel API file
try {
  const result = execSync(`node --check api/[...path].js`, { cwd: process.cwd(), encoding: "utf8" });
  console.log(`OK: api/[...path].js`);
} catch (e) {
  console.error(`ERROR: api/[...path].js - ${e.message.split("\n")[0]}`);
  allOk = false;
}

// Check package.json
try {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  console.log(`package.json scripts:`, pkg.scripts);
  console.log(`package.json engines:`, pkg.engines);
} catch (e) {
  console.error("ERROR reading package.json:", e.message);
  allOk = false;
}

// Check .env.example
try {
  const envExample = fs.readFileSync(".env.example", "utf8");
  console.log(".env.example variables:", envExample.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=")[0]));
} catch (e) {
  console.error("ERROR reading .env.example:", e.message);
  allOk = false;
}

console.log(allOk ? "\nAll syntax checks PASSED" : "\nSome syntax checks FAILED");
process.exit(allOk ? 0 : 1);
