// lib/alltick.ts

export interface TickData {
  price: number;
  time: number;          // seconds (lightweight-charts ke liye)
  type: "buy" | "sell";
  volume: number;
}

export class AllTickService {
  private ws: WebSocket | null = null;
  private token: string;
  private symbol: string;
  private onTickCallback: ((tick: TickData) => void) | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isConnecting: boolean = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(token: string, symbol: string = "XAUUSD") {
    this.token = token.trim();
    this.symbol = symbol;
  }

  public connect(onTick: (tick: TickData) => void) {
   if (!this.token) {
      console.warn("⚠️ AllTick Token missing or using placeholder.");
      return;
    }

    if (this.ws || this.isConnecting) return;

    this.isConnecting = true;
    this.onTickCallback = onTick;

    const url = `wss://quote.alltick.co/quote-b-ws-api?token=${this.token}`;

    try {
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        this.isConnecting = false;
        console.log("✅ Connected to AllTick WebSocket");

        // Heartbeat every 10s (mandatory)
        this.pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                cmd_id: 22000,
                seq_id: 1,
                trace: "ping-" + Date.now(),
                data: {},
              })
            );
          }
        }, 10000);

        // Subscribe to Latest Trade Price (cmd 22004)
        const subMsg = {
          cmd_id: 22004,
          seq_id: 2,
          trace: "guardeer_sub_" + Date.now(),
          data: {
            symbol_list: [{ code: this.symbol }],
          },
        };
        socket.send(JSON.stringify(subMsg));
        console.log("📡 Subscription sent for", this.symbol);
      };

      socket.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);

          // 1. Subscription confirmation
          if (res.cmd_id === 22005) {
            if (res.ret === 200) {
              console.log("✅ Subscription successful");
            } else {
              console.error("❌ Subscription failed:", res.msg, res);
            }
            return;
          }

          // 2. Heartbeat response (ignore)
          if (res.cmd_id === 22001) return;

          // 3. Real tick data (cmd 22998)
          if (res.cmd_id === 22998 && res.data) {
            const d = res.data;
            const price = parseFloat(d.price);
            if (isNaN(price)) return;

            // tick_time is in milliseconds
            const time = d.tick_time
              ? Math.floor(Number(d.tick_time) / 1000)
              : Math.floor(Date.now() / 1000);

            // trade_direction: 1 = buy, 2 = sell
            const type: "buy" | "sell" =
              Number(d.trade_direction) === 2 ? "sell" : "buy";

            const volume = parseFloat(d.volume || "1") || 1;

            if (this.onTickCallback) {
              this.onTickCallback({ price, time, type, volume });
            }
          }
        } catch (err) {
          console.error("Parse Error:", err);
        }
      };

      socket.onerror = (err) => {
        this.isConnecting = false;
        console.warn("WebSocket error / state change:", err);
      };

      socket.onclose = (event) => {
        this.isConnecting = false;
        console.log("WebSocket Closed", event.code, event.reason);
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        this.ws = null;

        // Auto reconnect after 3 seconds
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
 // this.reconnectTimeout = setTimeout(() => {
//   console.log("🔄 Reconnecting...");
//   this.connect(onTick);
// }, 3000);
      };
    } catch (e) {
      this.isConnecting = false;
      console.error("Failed to establish WebSocket:", e);
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.isConnecting = false;
  }
}