// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
var distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", app: "FreeFire 3D: Battle Royale" });
});
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
var server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`FreeFire 3D production server running on http://0.0.0.0:${PORT}`);
});
server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
});
