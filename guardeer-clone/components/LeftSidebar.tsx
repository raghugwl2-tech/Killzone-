"use client";

import { useState } from "react";

const tools = [
  { id: "clean", label: "Clean Chart", icon: "▣" },
  { id: "flow", label: "Flow Mode", icon: "〰" },
  { id: "bubbles", label: "Volume Bubbles", icon: "◉" },
  { id: "cvd", label: "CVD", icon: "Δ" },
  { id: "dom", label: "DOM", icon: "☰" },
  { id: "profile", label: "Volume Profile", icon: "▮" },
  { id: "heatmap", label: "Heatmap", icon: "▦" },
  { id: "levels", label: "Key Levels", icon: "━" },
];

export default function LeftSidebar() {
  const [active, setActive] = useState("clean");

  return (
    <aside className="flex w-14 flex-col items-center gap-1 border-r border-[#1E2329] bg-[#0B0E11] py-3 md:w-44 md:items-stretch md:px-2">
      <div className="mb-2 hidden px-2 text-[10px] font-semibold uppercase tracking-wider text-[#848E9C] md:block">
        Order Flow Tools
      </div>

      {tools.map((tool) => {
        const isActive = active === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setActive(tool.id)}
            className={`group flex items-center gap-3 rounded-md px-2 py-2.5 text-left transition ${
              isActive
                ? "bg-[#1E2329] text-[#00D4FF]"
                : "text-[#848E9C] hover:bg-[#111418] hover:text-white"
            }`}
            title={tool.label}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-sm">
              {tool.icon}
            </span>
            <span className="hidden text-xs font-medium md:block">{tool.label}</span>
            {isActive && (
              <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-[#00D4FF] md:block" />
            )}
          </button>
        );
      })}
    </aside>
  );
}