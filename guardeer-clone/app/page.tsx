"use client";

import { useState, useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi } from "lightweight-charts";
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

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("guardeer_theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Initialize Lightweight Charts (v4+ syntax)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === "dark";
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#0B0E11' : '#FFFFFF' },
        textColor: isDark ? '#9194A1' : '#1E2329',
      },
      grid: {
        vertLines: { color: isDark ? '#1F242D' : '#E6E8EA' },
        horzLines: { color: isDark ? '#1F242D' : '#E6E8EA' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00E676',
      downColor: '#FF355E',
      borderVisible: false,
      wickUpColor: '#00E676',
      wickDownColor: '#FF355E',
    });
    candleSeriesRef.current = candleSeries as any;

    // Seed dummy initial history so chart renders immediately
    const now = Math.floor(Date.now() / 1000);
    candleSeries.setData([
      { time: now - 300, open: 2350, high: 2353, low: 2348, close: 2351 },
      { time: now - 240, open: 2351, high: 2355, low: 2350, close: 2354 },
      { time: now - 180, open: 2354, high: 2356, low: 2352, close: 2353 },
      { time: now - 120, open: 2353, high: 2358, low: 2353, close: 2357 },
      { time: now - 60,  open: 2357, high: 2360, low: 2355, close: 2359 },
    ]);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme]);

  // Connect to SSE Bridge & Feed Live Ticks into Lightweight Chart
  useEffect(() => {
    let runningDelta = 0;
    let runningCvd = 0;
    const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:3001";
    
    console.log("Attempting to connect to SSE bridge:", bridgeUrl);
    const eventSource = new EventSource(`${bridgeUrl}/stream`);

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      try {
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

        // Update Lightweight Chart dynamically with live tick
        if (candleSeriesRef.current) {
          const currentTime = Math.floor((data.timestamp || Date.now()) / 1000);
          candleSeriesRef.current.update({
            time: currentTime,
            open: price - 0.2,
            high: price + 0.5,
            low: price - 0.5,
            close: price,
          });
        }

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

    eventSource.onerror = () => setIsConnected(false);

    return () => eventSource.close();
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
      <header className={`flex h-12 w-full items-center justify-between border-b px-4 select-none ${isDark ? "border-[#1E2329] bg-[#161B22]" : "border-[#E6E8EA] bg-[#FFFFFF]"}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider text-[#00D4FF]">GUARDEER</span>
            <span className="rounded bg-[#00D4FF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#00D4FF]">PRIME</span>
          </div>
          <div className={`h-4 w-[1px] ${isDark ? "bg-[#1E2329]" : "bg-[#E6E8EA]"}`} />
          <button className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${isDark ? "bg-[#0B0E11]" : "bg-[#F0F2F5]"}`}>
            <span className="font-bold">XAUUSD</span>
            <span className="text-[10px] text-[#848E9C]">${livePrice.toFixed(2)}</span>
            <ChevronDown size={14} className="text-[#848E9C]" />
          </button>
          <div className={`flex gap-1 rounded-md p-1 text-xs ${isDark ? "bg-[#0B0E11]" : "bg-[#F0F2F5]"}`}>
            {["1m", "5m", "15m", "1H", "4H", "D"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                  timeframe === tf ? "bg-[#2B313A] text-[#00D4FF] font-semibold" : "text-[#848E9C] hover:text-white"
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
            {isConnected ? "LIVE STREAM ACTIVE" : "CONNECTING..."}
          </span>
          <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B0E11] text-yellow-400">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`flex w-14 flex-col items-center gap-1.5 border-r py-3 md:w-48 md:items-stretch md:px-2 select-none ${isDark ? "border-[#1E2329] bg-[#161B22]" : "border-[#E6E8EA] bg-[#FFFFFF]"}`}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                  isActive ? "bg-[#0B0E11] text-[#00D4FF] border-l-2 border-[#00D4FF]" : "text-[#848E9C] hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="hidden text-xs font-medium md:block">{tool.label}</span>
              </button>
            );
          })}
        </aside>

        <main className={`flex flex-1 flex-col p-2 min-w-0 ${isDark ? "bg-[#0B0E11]" : "bg-[#F8F9FA]"}`}>
          <div ref={chartContainerRef} className={`h-full w-full rounded-lg border overflow-hidden ${isDark ? "border-[#1E2329]" : "border-[#E6E8EA]"}`} />
        </main>

        <aside className={`hidden w-80 flex-col border-l lg:flex select-none ${isDark ? "border-[#1E2329] bg-[#161B22]" : "border-[#E6E8EA] bg-[#FFFFFF]"}`}>
          <div className="flex border-b text-xs font-medium text-[#848E9C] border-[#1E2329]">
            <button className="flex flex-1 items-center justify-center gap-1.5 py-3 border-b-2 border-[#00D4FF] text-white font-semibold">
              <Activity size={14} /> Live Tape
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden p-3 font-mono text-xs">
            <div className="grid grid-cols-3 border-b pb-1 text-[10px] font-bold text-[#848E9C] border-zinc-800">
              <span>PRICE</span>
              <span className="text-center">QTY</span>
              <span className="text-right">TIME</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 mt-1">
              {trades.map((t) => (
                <div key={t.id} className={`grid grid-cols-3 py-1 px-1.5 rounded text-[11px] ${t.type === "buy" ? "bg-[#00E676]/10 text-[#00E676]" : "bg-[#FF355E]/10 text-[#FF355E]"}`}>
                  <span className="font-bold">${t.price.toFixed(2)}</span>
                  <span className="text-center">{t.volume}</span>
                  <span className="text-right text-[10px] text-[#848E9C]">{t.time}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer className={`flex h-7 w-full items-center justify-between border-t px-4 text-[11px] font-mono text-[#848E9C] select-none ${isDark ? "border-[#1E2329] bg-[#161B22]" : "border-[#E6E8EA] bg-[#FFFFFF]"}`}>
        <div className="flex items-center gap-6">
          <span>DELTA: <strong className={delta >= 0 ? "text-[#00E676]" : "text-[#FF355E]"}>{delta >= 0 ? `+${delta}` : delta}</strong></span>
          <span>CVD: <strong className={cvd >= 0 ? "text-[#00E676]" : "text-[#FF355E]"}>{cvd >= 0 ? `+${cvd}` : cvd}</strong></span>
        </div>
        <div>MARKET: <strong className="text-white">XAUUSD (ALLTICK INTEGRATED)</strong></div>
      </footer>
    </div>
  );
}