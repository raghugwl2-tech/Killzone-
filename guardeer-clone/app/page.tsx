"use client";

import { useState, useEffect, useRef } from "react";
import { 
  BarChart2, 
  Activity, 
  Layers, 
  Sliders, 
  Grid, 
  TrendingUp, 
  ShieldAlert, 
  Calendar, 
  BookOpen, 
  ChevronDown,
  Sun,
  Moon,
  Pencil,
  Settings,
  Radio
} from "lucide-react";

interface TradeItem {
  id: string;
  price: number;
  volume: number;
  type: "buy" | "sell";
  time: string;
}

export default function Home() {
  const [activeTool, setActiveTool] = useState("flow");
  const [activeTab, setActiveTab] = useState("metrics");
  const [timeframe, setTimeframe] = useState("1m");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  const [livePrice, setLivePrice] = useState<number>(2350.50);
  const [delta, setDelta] = useState<number>(0);
  const [cvd, setCvd] = useState<number>(0);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const tvContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("guardeer_theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Load TradingView Script
  useEffect(() => {
    if (!tvContainerRef.current) return;
    tvContainerRef.current.innerHTML = "";

    const containerId = "tradingview_widget_" + Math.random().toString(36).substring(7);
    const widgetDiv = document.createElement("div");
    widgetDiv.id = containerId;
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    tvContainerRef.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== "undefined") {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: "OANDA:XAUUSD",
          interval: timeframe === "1m" ? "1" : timeframe === "5m" ? "5" : timeframe === "15m" ? "15" : timeframe === "1H" ? "60" : "240",
          timezone: "Etc/UTC",
          theme: theme,
          style: "1",
          locale: "en",
          toolbar_bg: theme === "dark" ? "#161B22" : "#f1f3f6",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerId,
          studies: ["Volume@tv-basicstudies"],
        });
      }
    };

    tvContainerRef.current.appendChild(script);
  }, [theme, timeframe]);

  // Connect to local Node.js bridge server via Server-Sent Events (SSE)
  useEffect(() => {
    let runningDelta = 0;
    let runningCvd = 0;

    console.log("Attempting to connect to SSE bridge...");
    const eventSource = new EventSource("http://localhost:3001/stream");

    eventSource.onopen = () => {
      console.log("SSE Connection Open Successfully!");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        console.log("SSE Data received:", event.data);
        const data = JSON.parse(event.data);
        const price = Number(data.price || 2350.50);
        const volume = Number(data.volume || 1);
        const isBuy = data.direction === 1;

        setLivePrice(price);

        const tradeVal = isBuy ? volume : -volume;
        runningDelta += tradeVal;
        runningCvd += tradeVal;

        setDelta(Number(runningDelta.toFixed(2)));
        setCvd(Number(runningCvd.toFixed(2)));

        const newTrade: TradeItem = {
          id: Math.random().toString(36).substring(7),
          price: price,
          volume: volume,
          type: isBuy ? "buy" : "sell",
          time: new Date().toLocaleTimeString(),
        };

        setTrades((prev) => [newTrade, ...prev.slice(0, 100)]);
        setIsConnected(true);
      } catch (err) {
        console.error("Stream parse error:", err);
      }
    };

    eventSource.onerror = () => {
      // Silent handling to prevent Next.js error overlay on auto-reconnects
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("guardeer_theme", nextTheme);
  };

  const isDark = theme === "dark";

  const tools = [
    { id: "clean", label: "Clean Chart", icon: BarChart2 },
    { id: "flow", label: "Flow Mode", icon: Activity },
    { id: "bubbles", label: "Volume Bubbles", icon: Layers },
    { id: "cvd", label: "CVD", icon: Sliders },
    { id: "dom", label: "DOM", icon: Grid },
    { id: "profile", label: "Volume Profile", icon: TrendingUp },
    { id: "draw", label: "Drawing Tool", icon: Pencil },
    { id: "settings", label: "Chart Settings", icon: Settings },
  ];

  return (
    <div className={`flex h-screen w-screen flex-col overflow-hidden transition-colors duration-200 ${isDark ? "bg-[#0B0E11] text-[#EAECEF]" : "bg-[#F8F9FA] text-[#1E2329]"}`}>
      {/* Top Header */}
      <header className={`flex h-12 w-full items-center justify-between border-b px-4 select-none transition-colors duration-200 ${isDark ? "border-[#1E2329] bg-[#161B22]" : "border-[#E6E8EA] bg-[#FFFFFF]"}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider text-[#00D4FF]">GUARDEER</span>
            <span className="rounded bg-[#00D4FF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#00D4FF]">PRIME</span>
          </div>

          <div className={`h-4 w-[1px] ${isDark ? "bg-[#1E2329]" : "bg-[#E6E8EA]"}`} />

          <button className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition ${isDark ? "bg-[#0B0E11] hover:bg-[#2B313A]" : "bg-[#F0F2F5] hover:bg-[#E6E8EA]"}`}>
            <span className={`font-bold ${isDark ? "text-white" : "text-black"}`}>XAUUSD</span>
            <span className="text-[10px] text-[#848E9C]">${livePrice.toFixed(2)}</span>
            <ChevronDown size={14} className="text-[#848E9C]" />
          </button>

          <div className={`flex gap-1 rounded-md p-1 text-xs ${isDark ? "bg-[#0B0E11]" : "bg-[#F0F2F5]"}`}>
            {["1m", "5m", "15m", "1H", "4H", "D"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                  timeframe === tf 
                    ? (isDark ? "bg-[#2B313A] text-[#00D4FF] font-semibold" : "bg-[#FFFFFF] text-[#00D4FF] font-semibold shadow-sm") 
                    : "text-[#848E9C] hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#848E9C]">
          <span className={`flex items-center gap-1.5 ${isConnected ? "text-[#00E676]" : "text-red-500"}`}>
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-[#00E676] animate-pulse" : "bg-red-500"}`} />
            {isConnected ? "BRIDGE STREAM ACTIVE" : "CONNECTING TO BRIDGE..."}
          </span>

          <div className={`h-4 w-[1px] ${isDark ? "bg-[#1E2329]" : "bg-[#E6E8EA]"}`} />

          <button onClick={toggleTheme} className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDark ? "bg-[#0B0E11] text-yellow-400 hover:bg-[#2B313A]" : "bg-[#F0F2F5] text-slate-700 hover:bg-[#E6E8EA]"}`}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className={`flex w-14 flex-col items-center gap-1.5 border-r py-3 md:w-48 md:items-stretch md:px-2 select-none transition-colors duration-200 ${isDark ? "border-[#1E2329] bg-[#161B22]" : "border-[#E6E8EA] bg-[#FFFFFF]"}`}>
          <div className="mb-1 hidden px-2 text-[10px] font-bold uppercase tracking-wider text-[#848E9C] md:block">Tools</div>
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                  isActive
                    ? isDark ? "bg-[#0B0E11] text-[#00D4FF] border-l-2 border-[#00D4FF]" : "bg-[#F0F2F5] text-[#00D4FF] border-l-2 border-[#00D4FF]"
                    : isDark ? "text-[#848E9C] hover:bg-[#0B0E11]/50 hover:text-white" : "text-[#848E9C] hover:bg-[#F0F2F5] hover:text-black"
                }`}
              >
                <Icon size={18} />
                <span className="hidden text-xs font-medium md:block">{tool.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Chart / Workspace Area */}
        <main className={`flex flex-1 flex-col p-2 min-w-0 ${isDark ? "bg-[#0B0E11]" : "bg-[#F8F9FA]"}`}>
          <div ref={tvContainerRef} className={`h-full w-full rounded-lg border overflow-hidden ${isDark ? "border-[#1E2329]" : "border-[#E6E8EA]"}`} />
        </main>

        {/* Right Sidebar with Live Tape */}
        <aside className={`hidden w-80 flex-col border-l lg:flex select-none transition-colors duration-200 ${isDark ? "border-[#1E2329] bg-[#161B22]" : "border-[#E6E8EA] bg-[#FFFFFF]"}`}>
          <div className={`flex border-b text-xs font-medium text-[#848E9C] ${isDark ? "border-[#1E2329]" : "border-[#E6E8EA]"}`}>
            {[
              { id: "metrics", label: "Live Tape", icon: Activity },
              { id: "journal", label: "Journal", icon: BookOpen },
              { id: "alerts", label: "Alerts", icon: ShieldAlert },
              { id: "calendar", label: "Events", icon: Calendar },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-3 transition ${
                    isActive ? (isDark ? "border-b-2 border-[#00D4FF] text-white font-semibold" : "border-b-2 border-[#00D4FF] text-black font-semibold") : isDark ? "hover:text-white" : "hover:text-black"
                  }`}
                >
                  <TabIcon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "metrics" ? (
            <div className="flex flex-1 flex-col overflow-hidden p-3 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between text-[11px] text-[#848E9C]">
                <span>TIME & SALES</span>
                <span className="flex items-center gap-1 text-[#00E676]">
                  <Radio size={12} className="animate-pulse" />
                  STREAMING
                </span>
              </div>

              <div className="grid grid-cols-3 border-b pb-1 text-[10px] font-bold text-[#848E9C] border-zinc-800">
                <span>PRICE</span>
                <span className="text-center">QTY</span>
                <span className="text-right">TIME</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 scrollbar-thin">
                {trades.map((t) => (
                  <div 
                    key={t.id} 
                    className={`grid grid-cols-3 py-1 px-1.5 rounded text-[11px] transition-colors ${
                      t.type === "buy" ? "bg-[#00E676]/10 text-[#00E676]" : "bg-[#FF355E]/10 text-[#FF355E]"
                    }`}
                  >
                    <span className="font-bold">${t.price.toFixed(2)}</span>
                    <span className="text-center">{t.volume}</span>
                    <span className="text-right text-[10px] text-[#848E9C]">{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-xs text-[#848E9C]">
              Selected Tab: <span className="text-[#00D4FF] font-medium capitalize">{activeTab}</span>
            </div>
          )}
        </aside>
      </div>

      {/* Footer */}
      <footer className={`flex h-7 w-full items-center justify-between border-t px-4 text-[11px] font-mono text-[#848E9C] select-none transition-colors duration-200 ${isDark ? "border-[#1E2329] bg-[#161B22]" : "border-[#E6E8EA] bg-[#FFFFFF]"}`}>
        <div className="flex items-center gap-6">
          <span>DELTA: <strong className={delta >= 0 ? "text-[#00E676]" : "text-[#FF355E]"}>{delta >= 0 ? `+${delta}` : delta}</strong></span>
          <span>CVD: <strong className={cvd >= 0 ? "text-[#00E676]" : "text-[#FF355E]"}>{cvd >= 0 ? `+${cvd}` : cvd}</strong></span>
        </div>
        <div>MARKET: <strong className={isDark ? "text-white" : "text-black"}>XAUUSD (NODE BRIDGE)</strong></div>
      </footer>
    </div>
  );
}