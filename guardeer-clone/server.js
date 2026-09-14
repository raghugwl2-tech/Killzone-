const { createServer } = require("http");
const WebSocket = require("ws");

const token = "fd1d532d2855af669a759522d244b6fc-c-app";
let allTickWs = null;
let latestTickData = null;
let heartbeatTimer = null;
const clients = new Set();

function connectAllTick() {
  if (allTickWs && (allTickWs.readyState === WebSocket.OPEN || allTickWs.readyState === WebSocket.CONNECTING)) return;

  console.log("Connecting to AllTick Global WS...");
  allTickWs = new WebSocket(`wss://quote.alltick.co/quote-b-ws-api?token=${token}`);

  allTickWs.on("open", () => {
    console.log("Connected to AllTick Successfully! Subscribing to GOLD...");
    const subMsg = {
      cmd_id: 22004,
      seq_id: 1,
      trace: "guardeer-global-sub",
      data: {
        symbol_list: [{ code: "GOLD" }]
      }
    };
    allTickWs.send(JSON.stringify(subMsg));

    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (allTickWs.readyState === WebSocket.OPEN) {
        allTickWs.send(JSON.stringify({ cmd_id: 20000, trace: "heartbeat" }));
      }
    }, 20000);
  });

  allTickWs.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.cmd_id === 22998 && msg.data) {
        latestTickData = msg.data;
        for (const clientRes of clients) {
          clientRes.write(`data: ${JSON.stringify(msg.data)}\n\n`);
        }
      }
    } catch (err) {
      console.error("Parse error:", err.message);
    }
  });

  allTickWs.on("error", (err) => {
    console.error("AllTick WS Error:", err.message);
  });

  allTickWs.on("close", (code, reason) => {
    console.log(`AllTick connection closed (Code: ${code}). Reconnecting in 5 seconds...`);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    allTickWs = null;
    setTimeout(connectAllTick, 5000);
  });
}

connectAllTick();

const server = createServer((req, res) => {
  if (req.url === "/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    clients.add(res);

    if (latestTickData) {
      res.write(`data: ${JSON.stringify(latestTickData)}\n\n`);
    }

    const sseHeartbeat = setInterval(() => {
      res.write(':ping\n\n');
    }, 15000);

    req.on("close", () => {
      clearInterval(sseHeartbeat);
      clients.delete(res);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3001, () => {
  console.log("Singleton Bridge server active on http://localhost:3001");
});