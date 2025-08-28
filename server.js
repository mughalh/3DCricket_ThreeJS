// server.js
import fs from "fs";
import http from "http";
import https from "https";
import express from "express";
import { Server } from "socket.io";

const app = express();

// --- HTTPS certs ---
const httpsOptions = {
  key: fs.readFileSync("certs/key.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
};

// --- Serve static files ---
app.use(express.static("public"));

// --- HTTPS server ---
const HOST = "192.168.1.27";   // your LAN IP
const PORT = 3443;
const httpsServer = https.createServer(httpsOptions, app);

// --- HTTP server for redirect ---
const httpServer = http.createServer((req, res) => {
  const redirectURL = `https://${HOST}:${PORT}${req.url}`;
  res.writeHead(301, { Location: redirectURL });
  res.end();
});

// --- Socket.IO on HTTPS ---
const io = new Server(httpsServer, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("sensor-data", (data) => {
    // Forward sensor data to all viewers (but not the sender)
    socket.broadcast.emit("sensor-data", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// --- Start servers ---
httpsServer.listen(PORT, HOST, () => {
  console.log(`✅ Secure server running at https://${HOST}:${PORT}`);
});

httpServer.listen(3000, HOST, () => {
  console.log(`🌐 Redirect server running at http://${HOST}:3000`);
  console.log(`👉 It will forward to https://${HOST}:${PORT}`);
});
