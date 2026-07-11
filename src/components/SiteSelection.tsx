import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, Star, TrendingUp, HelpCircle, MapPin, 
  ChevronDown, ChevronUp, RefreshCw, BarChart4, Table, Search
} from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis 
} from 'recharts';
import { RegionConfig, TractScorecardRow } from '../types';
import { BUSINESS_PRESETS, METRIC_LABELS } from '../presets';

interface SiteSelectionProps {
  region: RegionConfig;
}

interface RankedTract extends TractScorecardRow {
  s_pop: number;
  s_inc: number;
  s_traffic: number;
  s_veh: number;
  s_edu: number;
  site_score: number;
}

export const SiteSelection: React.FC<SiteSelectionProps> = ({ region }) => {
  const [presetName, setPresetName] = useState<string>("Car Wash");
  const [weights, setWeights] = useState({
    population: 0.15,
    income: 0.15,
    traffic: 0.35,
    vehicle_ownership: 0.30,
    education: 0.05,
  });

  const [rawTracts, setRawTracts] = useState<TractScorecardRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trafficRadius, setTrafficRadius] = useState(1.5);
  const [filterQuery, setFilterQuery] = useState("");
  const [isFullListExpanded, setIsFullListExpanded] = useState(false);

  // Sync weights when presetName changes
  useEffect(() => {
    if (presetName !== "Custom") {
      const p = BUSINESS_PRESETS[presetName];
      if (p) {
        setWeights({
          population: p.population,
          income: p.income,
          traffic: p.traffic,
          vehicle_ownership: p.vehicle_ownership,
          education: p.education,
        });
      }
    }
  }, [presetName]);

  const fetchScorecard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scorecard?state_fips=${region.state_fips}&county_code=${region.county_code}&traffic_radius=${trafficRadius}`);
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to load tract scorecard.");
      }
      const data = await res.json();
      setRawTracts(data);
    } catch (err: any) {
      setError(err.message || "Tract scorecard could not be generated.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, [region, trafficRadius]);

  const handleSliderChange = (key: keyof typeof weights, value: number) => {
    setPresetName("Custom");
    setWeights(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Rank and score tracts based on weights
  const rankedTracts = useMemo<RankedTract[]>(() => {
    if (rawTracts.length === 0) return [];
    
    const n = rawTracts.length;
    
    // 1. Calculate percentile rank for each tract on each metric
    const getPercentile = (arr: number[], val: number) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const index = sorted.indexOf(val);
      if (index === -1) return 0;
      return (index / (n - 1)) * 100;
    };

    const populations = rawTracts.map(t => t.population || 0);
    const incomes = rawTracts.map(t => t.median_household_income || 0);
    const traffics = rawTracts.map(t => t.nearby_max_aadt || 0);
    const vehicles = rawTracts.map(t => t.pct_2plus_vehicles || 0);
    const educations = rawTracts.map(t => t.college_plus_pct || 0);

    // Normalize weights to sum to 1.0
    const wSum = weights.population + weights.income + weights.traffic + weights.vehicle_ownership + weights.education;
    const normWeights = {
      population: weights.population / (wSum || 1),
      income: weights.income / (wSum || 1),
      traffic: weights.traffic / (wSum || 1),
      vehicle_ownership: weights.vehicle_ownership / (wSum || 1),
      education: weights.education / (wSum || 1),
    };

    const evaluated = rawTracts.map(t => {
      const s_pop = getPercentile(populations, t.population || 0);
      const s_inc = getPercentile(incomes, t.median_household_income || 0);
      const s_traffic = getPercentile(traffics, t.nearby_max_aadt || 0);
      const s_veh = getPercentile(vehicles, t.pct_2plus_vehicles || 0);
      const s_edu = getPercentile(educations, t.college_plus_pct || 0);

      const site_score = (
        s_pop * normWeights.population +
        s_inc * normWeights.income +
        s_traffic * normWeights.traffic +
        s_veh * normWeights.vehicle_ownership +
        s_edu * normWeights.education
      );

      return {
        ...t,
        s_pop,
        s_inc,
        s_traffic,
        s_veh,
        s_edu,
        site_score: parseFloat(site_score.toFixed(1))
      };
    });

    return evaluated.sort((a, b) => b.site_score - a.site_score);
  }, [rawTracts, weights]);

  // Filtered full list
  const filteredTracts = useMemo(() => {
    if (!filterQuery) return rankedTracts;
    const query = filterQuery.toLowerCase();
    return rankedTracts.filter(t => 
      t.tract_name.toLowerCase().includes(query) || 
      t.tract_fips.includes(query) ||
      (t.tract_label && t.tract_label.toLowerCase().includes(query))
    );
  }, [rankedTracts, filterQuery]);

  const top10Tracts = useMemo(() => {
    return rankedTracts.slice(0, 10);
  }, [rankedTracts]);

  // Format helper for numbers
  const formatNum = (num: number | undefined) => {
    if (num === undefined || num === null) return "—";
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (val: number | undefined) => {
    if (!val) return "—";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const weightsSumPercent = useMemo(() => {
    const sum = weights.population + weights.income + weights.traffic + weights.vehicle_ownership + weights.education;
    return Math.round(sum * 100);
  }, [weights]);

  return (
    <div className="space-y-6">
      {/* Parameters Control Box */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Sliders & Presets */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">Custom Scoring Weights</h3>
            </div>
            
            {/* Preset selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Preset:</span>
              <select
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 cursor-pointer shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {Object.keys(BUSINESS_PRESETS).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-500 font-medium">
            {presetName !== "Custom" ? BUSINESS_PRESETS[presetName].description : "Adjust sliders to prioritize factors. Weights normalize automatically."}
          </p>

          {/* Sliders Grid */}
          <div className="space-y-3 pt-2">
            {Object.keys(weights).map((key) => {
              const metricKey = key as keyof typeof weights;
              const val = weights[metricKey];
              const pct = Math.round(val * 100);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">{METRIC_LABELS[key] || key}</span>
                    <span className="text-blue-600 font-bold">{pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={val}
                    onChange={(e) => handleSliderChange(metricKey, parseFloat(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-blue-600"
                  />
                </div>
              );
            })}
          </div>

          {weightsSumPercent !== 100 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-medium text-blue-700 flex items-center gap-1">
              <HelpCircle className="h-3 w-3 shrink-0" />
              Weights sum to {weightsSumPercent}%. They are automatically normalized to 100% for score calculation.
            </div>
          )}
        </div>

        {/* Region & Info Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Region Profile</span>
            <h4 className="text-lg font-extrabold text-gray-900">{region.county_name}</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              We compile and index demographics across <strong>{rawTracts.length}</strong> Census Tracts in {region.county_name}. Select a metric preset, and our site engine will rank candidates in real-time.
            </p>
          </div>

          {/* Traffic integration parameter */}
          <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">Traffic Integration Radius:</span>
              <span className="font-bold text-blue-600">{trafficRadius} mi</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={trafficRadius}
              onChange={(e) => setTrafficRadius(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-blue-600"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-700">Evaluating & indexing all census tracts...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isLoading && rankedTracts.length > 0 && (
        <div className="space-y-6">
          {/* Scatter Chart & Top 10 Bento Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Top 10 List */}
            <div className="lg:col-span-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Top 10 Locations
                </h3>
                <div className="space-y-2">
                  {top10Tracts.map((tract, idx) => (
                    <div 
                      key={tract.tract_fips}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-blue-50 transition"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold text-blue-600 block uppercase">Rank #{idx + 1}</span>
                        <span className="text-xs font-bold text-gray-900 block truncate" title={tract.tract_label}>
                          {tract.tract_label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono block">Pop: {formatNum(tract.population)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-gray-900">{tract.site_score}</span>
                        <span className="text-[8px] text-gray-400 block font-semibold uppercase">Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scatter Chart Visualizer */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart4 className="h-4 w-4 text-blue-600" />
                Tract Dispersion: Income vs Site Score
              </h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Each circle represents a Census Tract. X-axis shows <strong>Median Household Income</strong>, Y-axis represents computed <strong>Site Score</strong>, and circle size indicates <strong>Population</strong>.
              </p>
              
              <div className="h-80 w-full pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="median_household_income" 
                      name="Income" 
                      unit="$" 
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="site_score" 
                      name="Site Score" 
                      domain={[0, 100]}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="population" 
                      range={[40, 400]} 
                      name="Population" 
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      formatter={(value: any, name: string) => {
                        if (name === "Income") return formatCurrency(value);
                        if (name === "Population") return formatNum(value);
                        return value;
                      }}
                    />
                    <Scatter 
                      name="Tracts" 
                      data={rankedTracts} 
                      fill="#1E88E5" 
                      fillOpacity={0.7}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Full Database Table Section */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-gray-100 gap-3">
              <div className="flex items-center gap-2">
                <Table className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">All Scorecard Candidates</h3>
              </div>

              {/* Filter search box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by tract name or ID..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-3 text-xs font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Tract Label</th>
                    <th className="px-5 py-3">Population</th>
                    <th className="px-5 py-3">Household Income</th>
                    <th className="px-5 py-3">Peak Traffic (AADT)</th>
                    <th className="px-5 py-3">Education Degree%</th>
                    <th className="px-5 py-3 text-right">Site Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 font-semibold text-xs text-gray-600">
                  {filteredTracts.slice(0, isFullListExpanded ? undefined : 15).map((tract, idx) => (
                    <tr key={tract.tract_fips} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-mono text-blue-600">#{idx + 1}</td>
                      <td className="px-5 py-3 font-bold text-gray-900">{tract.tract_label}</td>
                      <td className="px-5 py-3">{formatNum(tract.population)}</td>
                      <td className="px-5 py-3">{formatCurrency(tract.median_household_income)}</td>
                      <td className="px-5 py-3">{formatNum(tract.nearby_max_aadt)}</td>
                      <td className="px-5 py-3">{tract.college_plus_pct ? `${tract.college_plus_pct}%` : "—"}</td>
                      <td className="px-5 py-3 text-right text-sm font-black text-blue-600">{tract.site_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTracts.length > 15 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <button
                  onClick={() => setIsFullListExpanded(!isFullListExpanded)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                >
                  {isFullListExpanded ? (
                    <>Show Less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show All {filteredTracts.length} Tracts <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
