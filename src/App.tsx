import React from 'react';
import { Scale } from 'lucide-react';
import { PropertyTaxDashboard } from './components/PropertyTaxDashboard';

function App() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-slate-950 block uppercase">CAD Audit System</span>
                <span className="text-[10px] font-bold text-indigo-600 block tracking-widest uppercase">Stylecraft Builders</span>
              </div>
            </div>

            {/* Live Status indicator */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">CAD Pipelines Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col">
        <PropertyTaxDashboard />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-semibold text-slate-400">
          <p>© 2026 Stylecraft Builders Inc. Internal Property Tax Auditing & Harvesting workspace.</p>
          <div className="flex gap-4">
            <span>Powered by Texas CAD Crawler Pipeline & Gemini Layout Extractors</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
