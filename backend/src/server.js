import "dotenv/config";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { chooseDriver, getDriver } from "./data/store.js";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PORT = process.env.PORT || 5000;

async function start() {
  const driver = await chooseDriver();
  const { default: app } = await import("./app.js");

  const distPath = path.join(__dirname, "..", "frontend", "dist");
  if (fs.existsSync(distPath)) {
    const stack = app._router?.stack || [];
    const maybeError = stack.length >= 2 ? stack.slice(-2) : [];
    if (maybeError.length === 2) stack.splice(-2, 2);
    app.use(express.static(distPath));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(distPath, "index.html")));
    for (const layer of maybeError) stack.push(layer);
  }

  const server = app.listen(PORT, () => {
    console.log(`\n  QUANTUM Fee Management API`);
    console.log(`  → http://localhost:${PORT}`);
    console.log(`  → data driver: ${getDriver()}`);
    console.log("");
  });

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is in use. Set PORT in backend/.env to a free port.`);
      process.exit(1);
    }
    throw e;
  });
}

start().catch((e) => {
  console.error("[quantum] failed to start:", e.message);
  process.exit(1);
});
