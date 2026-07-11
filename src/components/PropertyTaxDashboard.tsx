import React, { useState, useEffect } from "react";
import { 
  Building, Play, RefreshCw, BarChart3, HelpCircle, HardHat, 
  TrendingDown, ShieldCheck, DollarSign, Wallet2, CheckCircle2, AlertCircle 
} from "lucide-react";
import { PropertyTaxRecord, PropertyStage, ScraperLog, DashboardMetrics } from "../propertyTypes";
import { ScraperConsole } from "./ScraperConsole";
import { PropertyTable } from "./PropertyTable";
import { PropertyModal } from "./PropertyModal";

export function PropertyTaxDashboard() {
  const [properties, setProperties] = useState<PropertyTaxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<PropertyStage>("rendering");

  // Scraper controls
  const [selectedEntity, setSelectedEntity] = useState("Stylecraft Builders Inc");
  const [selectedCounty, setSelectedCounty] = useState("Brazos");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [scraperLogs, setScraperLogs] = useState<ScraperLog[]>([]);

  // Selected property for modal
  const [selectedProp, setSelectedProp] = useState<PropertyTaxRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Entities and counties from Stacy's email
  const ENTITY_COUNTIES = [
    {
      entity: "Stylecraft Builders Inc",
      counties: ["Brazos", "Burleson", "Grimes", "Montgomery", "Walker", "Washington"]
    },
    {
      entity: "Stylecraft Falcon Pointe LP",
      counties: ["McLennan"]
    },
    {
      entity: "Stylecraft Central Texas LP",
      counties: ["Bell", "Lampasas", "Williamson", "Guadalupe"]
    },
    {
      entity: "Stylecraft East Texas LLC",
      counties: ["Smith"]
    },
    {
      entity: "Ranier & Son Development LLC",
      counties: ["Burleson", "Washington", "Brazos", "Walker"]
    }
  ];

  const currentCountyList = ENTITY_COUNTIES.find(e => e.entity === selectedEntity)?.counties || [];

  // Set default county when entity changes
  useEffect(() => {
    if (currentCountyList.length > 0 && !currentCountyList.includes(selectedCounty)) {
      setSelectedCounty(currentCountyList[0]);
    }
  }, [selectedEntity]);

  // Load properties from API
  const loadProperties = async () => {
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error("Could not load properties from API", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Update a single property's details
  const handleUpdateProperty = async (id: string, fields: Partial<PropertyTaxRecord>) => {
    try {
      const res = await fetch("/api/properties/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, fields })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.property) {
          setProperties(prev => prev.map(p => p.id === id ? data.property : p));
          if (selectedProp?.id === id) {
            setSelectedProp(data.property);
          }
        }
      }
    } catch (err) {
      console.error("Error updating property", err);
    }
  };

  // File protest for a single property
  const handleFileProtest = async (id: string) => {
    try {
      const res = await fetch("/api/properties/protest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Reload
          await loadProperties();
          const updated = properties.find(p => p.id === id);
          if (updated) {
            // Re-fetch the updated item to update modal representation
            const freshRes = await fetch("/api/properties");
            if (freshRes.ok) {
              const freshData: PropertyTaxRecord[] = await freshRes.json();
              const freshItem = freshData.find(p => p.id === id) || null;
              setSelectedProp(freshItem);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error filing protest", err);
    }
  };

  // Bulk protest filing
  const handleBulkProtest = async (ids: string[]) => {
    try {
      const res = await fetch("/api/properties/protest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await loadProperties();
          alert(`Successfully filed property tax protests for ${data.updatedCount} properties!`);
        }
      }
    } catch (err) {
      console.error("Error filing bulk protests", err);
    }
  };

  // Simulated scraper pipeline run
  const handleRunScraper = async () => {
    if (isScraping) return;
    setIsScraping(true);
    setScrapingProgress(0);
    setScraperLogs([]);

    try {
      // Initiate background job simulation
      const response = await fetch("/api/properties/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ county: selectedCounty, entity: selectedEntity })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Feed logs progressively to create an authentic terminal simulation
        const totalLogs = data.logs || [];
        let logIndex = 0;

        const interval = setInterval(() => {
          if (logIndex < totalLogs.length) {
            setScraperLogs(prev => [...prev, totalLogs[logIndex]]);
            setScrapingProgress(Math.min(100, Math.round(((logIndex + 1) / totalLogs.length) * 100)));
            logIndex++;
          } else {
            clearInterval(interval);
            setIsScraping(false);
            setScrapingProgress(100);
            loadProperties(); // Reload properties to show updated stages!
          }
        }, 600); // 600ms per log entry
      } else {
        setIsScraping(false);
        setScraperLogs([{
          id: "err",
          timestamp: new Date().toLocaleTimeString(),
          level: "error",
          message: "Failed to connect to CAD Scraping Service. Server returned an error."
        }]);
      }
    } catch (err) {
      setIsScraping(false);
      setScraperLogs([{
        id: "err",
        timestamp: new Date().toLocaleTimeString(),
        level: "error",
        message: "Sc scraper connection error: Unable to contact Express scraper daemon."
      }]);
    }
  };

  // Calculations for dashboard metrics
  const computeMetrics = (): DashboardMetrics => {
    let renderingCount = 0;
    let protestCount = 0;
    let paymentCount = 0;
    let activeProtests = 0;
    let resolvedProtestsCount = 0;
    let totalTaxDue = 0;
    let totalTaxPaid = 0;
    let totalTaxUnpaid = 0;
    let estimatedSavings = 0;

    properties.forEach((p) => {
      if (p.stage === "rendering") renderingCount++;
      if (p.stage === "protest") protestCount++;
      if (p.stage === "payment") paymentCount++;

      if (p.status === "Protest Filed" || p.status === "Protest Hearing Scheduled") {
        activeProtests++;
      }
      if (p.status === "Protest Resolved") {
        resolvedProtestsCount++;
      }

      // Compute protest savings: (Proposed Appraisal - Settled Appraisal) * Tax Rate / 100
      if (p.protest_outcome_value && p.current_appraised_value && p.current_appraised_value > p.protest_outcome_value) {
        const rate = p.tax_rate || 2.0;
        const valuationSaved = p.current_appraised_value - p.protest_outcome_value;
        const taxSaved = (valuationSaved * rate) / 100;
        estimatedSavings += taxSaved;
      }

      // Compute tax dues
      if (p.tax_amount_due) {
        if (p.payment_status === "paid") {
          totalTaxPaid += p.tax_amount_due;
        } else {
          totalTaxUnpaid += p.tax_amount_due;
        }
        totalTaxDue += p.tax_amount_due;
      }
    });

    return {
      totalProperties: properties.length,
      renderingCount,
      protestCount,
      paymentCount,
      activeProtests,
      resolvedProtestsCount,
      totalTaxDue,
      totalTaxPaid,
      totalTaxUnpaid,
      estimatedSavings
    };
  };

  const metrics = computeMetrics();

  const handleSelectProperty = (prop: PropertyTaxRecord) => {
    setSelectedProp(prop);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title & Under Construction Notice */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-3xs">
              <HardHat className="h-3.5 w-3.5" />
              Builder Active Inventory Tracker
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Stylecraft Property Tax Harvest</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Tracking <span className="font-extrabold text-slate-800">600 homes</span> currently under construction across 12 Central Texas counties.
          </p>
        </div>
        
        {/* Scraper Config Card */}
        <div className="w-full md:w-auto bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Owner Entity</label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                disabled={isScraping}
                className="w-full px-3 py-1.5 border rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-indigo-500 bg-slate-50"
              >
                {ENTITY_COUNTIES.map(e => <option key={e.entity} value={e.entity}>{e.entity}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Target County</label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                disabled={isScraping}
                className="w-full px-3 py-1.5 border rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-indigo-500 bg-slate-50"
              >
                {currentCountyList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          <button
            id="start-scraper-btn"
            onClick={handleRunScraper}
            disabled={isScraping || currentCountyList.length === 0}
            className="w-full sm:w-auto px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-2 self-end shadow-xs"
          >
            {isScraping ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Crawling CAD...</>
            ) : (
              <><Play className="h-4 w-4" /> Run CAD Scraper</>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Overview Block */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Total Tracked */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">TOTAL PROPERTIES</span>
              <p className="text-2xl font-black text-slate-800 font-mono">{metrics.totalProperties}</p>
              <div className="flex gap-2 text-[10px] text-slate-400 font-semibold mt-1">
                <span>{metrics.renderingCount} R</span>
                <span>•</span>
                <span>{metrics.protestCount} P</span>
                <span>•</span>
                <span>{metrics.paymentCount} T</span>
              </div>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <Building className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Protests Saved (THE HERO METRIC) */}
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">TAX SAVINGS GENERATED</span>
              <p className="text-2xl font-black text-emerald-800 font-mono">${Math.round(metrics.estimatedSavings).toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                From {metrics.resolvedProtestsCount} settled protests
              </span>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Active Protests */}
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">ACTIVE PROTESTS</span>
              <p className="text-2xl font-black text-amber-800 font-mono">{metrics.activeProtests}</p>
              <span className="text-[10px] text-amber-600 font-semibold block mt-1">
                Under CAD / ARB review
              </span>
            </div>
            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Total Tax Liabilities */}
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">TAX LIABILITY SUMMARY</span>
              <p className="text-2xl font-black text-indigo-900 font-mono">${Math.round(metrics.totalTaxDue).toLocaleString()}</p>
              <div className="flex gap-2 text-[10px] text-indigo-500 font-semibold mt-1">
                <span className="text-emerald-600">${Math.round(metrics.totalTaxPaid).toLocaleString()} Paid</span>
                <span>•</span>
                <span className="text-amber-700">${Math.round(metrics.totalTaxUnpaid).toLocaleString()} Due</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl">
              <Wallet2 className="h-6 w-6" />
            </div>
          </div>

        </div>
      )}

      {/* Scraper Terminal Output Section */}
      {(isScraping || scraperLogs.length > 0) && (
        <div className="animate-fade-in">
          <ScraperConsole 
            logs={scraperLogs}
            isScraping={isScraping}
            activeEntity={selectedEntity}
            activeCounty={selectedCounty}
            progress={scrapingProgress}
          />
        </div>
      )}

      {/* Properties View */}
      <div className="space-y-4">
        {/* Properties list */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono font-bold animate-pulse">
            Loading properties database...
          </div>
        ) : (
          <PropertyTable 
            properties={properties}
            onSelectProperty={handleSelectProperty}
            onBulkProtest={handleBulkProtest}
          />
        )}
      </div>

      {/* Property Details & Notice Modal */}
      <PropertyModal 
        property={selectedProp}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProp(null); }}
        onUpdate={handleUpdateProperty}
        onFileProtest={handleFileProtest}
      />

    </div>
  );
}
