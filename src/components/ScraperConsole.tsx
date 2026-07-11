import React, { useEffect, useRef } from "react";
import { Terminal, RefreshCw, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { ScraperLog } from "../propertyTypes";

interface ScraperConsoleProps {
  logs: ScraperLog[];
  isScraping: boolean;
  activeEntity: string;
  activeCounty: string;
  progress: number;
}

export function ScraperConsole({ logs, isScraping, activeEntity, activeCounty, progress }: ScraperConsoleProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-slate-950 text-emerald-400 font-mono rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-[320px]">
      {/* Console Title bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-slate-300">CAD Crawler & OCR OCR Pipeline Logs</span>
        </div>
        <div className="flex items-center gap-2">
          {isScraping ? (
            <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">
              <RefreshCw className="h-3 w-3 animate-spin" /> Active {progress}%
            </span>
          ) : (
            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">
              Idle
            </span>
          )}
        </div>
      </div>

      {/* Terminal Screen */}
      <div id="scraper-log-console" className="flex-1 overflow-y-auto p-4 space-y-2 text-xs leading-relaxed select-text font-mono selection:bg-emerald-800 selection:text-white">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <Terminal className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-[11px] uppercase tracking-wider font-bold">Terminal initialized. Ready for CAD Scraping.</p>
            <p className="text-[10px] font-normal opacity-70 mt-1">Select an Owner Entity and Texas County to initiate parsing.</p>
          </div>
        ) : (
          <>
            <div className="text-slate-500 text-[10px] border-b border-slate-900 pb-1 mb-2">
              SESSION START // TARGET: {activeEntity.toUpperCase()} // COUNTY: {activeCounty.toUpperCase()}
            </div>
            
            {logs.map((log) => {
              let LogIcon = Info;
              let textColor = "text-slate-300";
              
              if (log.level === "success") {
                LogIcon = CheckCircle;
                textColor = "text-emerald-400";
              } else if (log.level === "warning") {
                LogIcon = AlertTriangle;
                textColor = "text-amber-400";
              } else if (log.level === "error") {
                LogIcon = AlertTriangle;
                textColor = "text-red-400";
              }

              return (
                <div key={log.id} className={`flex items-start gap-2.5 ${textColor} leading-normal`}>
                  <span className="text-[10px] text-slate-500 font-semibold select-none flex-shrink-0 mt-0.5 font-mono">
                    [{log.timestamp}]
                  </span>
                  <LogIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
                </div>
              );
            })}
            
            {isScraping && (
              <div className="flex items-center gap-2 text-emerald-500/70 animate-pulse text-[11px] pl-15 mt-2">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>Crawling data records...</span>
              </div>
            )}
            
            <div ref={terminalEndRef} />
          </>
        )}
      </div>

      {/* Progress Bar Footer */}
      {isScraping && (
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center gap-3">
          <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold font-mono">{progress}%</span>
        </div>
      )}
    </div>
  );
}
