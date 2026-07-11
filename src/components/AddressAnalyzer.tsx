import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Building, ShieldAlert, Thermometer, Info, 
  Map as MapIcon, RefreshCw, Navigation, HelpCircle, Landmark, Star
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { RegionConfig, GeocodeResult, CountyAcsData, TractAcsData, WeatherData, ZoningData, CrimeData, PermitsData, AmenitiesData } from '../types';
import { MetricCard } from './MetricCard';

interface AddressAnalyzerProps {
  region: RegionConfig;
}

export const AddressAnalyzer: React.FC<AddressAnalyzerProps> = ({ region }) => {
  const [address, setAddress] = useState(region.sample_addresses[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Loaded data states
  const [geocode, setGeocode] = useState<GeocodeResult | null>(null);
  const [countyAcs, setCountyAcs] = useState<CountyAcsData | null>(null);
  const [tractAcs, setTractAcs] = useState<TractAcsData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [zoning, setZoning] = useState<ZoningData | null>(null);
  const [crime, setCrime] = useState<CrimeData | null>(null);
  const [permits, setPermits] = useState<PermitsData | null>(null);
  const [amenities, setAmenities] = useState<AmenitiesData | null>(null);
  const [nearbyTraffic, setNearbyTraffic] = useState<any[]>([]);

  // Slider control states
  const [useGoogle, setUseGoogle] = useState(false);
  const [amenityRadius, setAmenityRadius] = useState(1.0);
  const [crimeRadius, setCrimeRadius] = useState(1.0);
  const [trafficRadius, setTrafficRadius] = useState(3.0);

  const fetchAllData = async (targetAddress: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Geocode
      const geoRes = await fetch(`/api/geocode?address=${encodeURIComponent(targetAddress)}`);
      if (!geoRes.ok) {
        throw new Error(await geoRes.text() || "Address geocoding failed.");
      }
      const geoData: GeocodeResult = await geoRes.json();
      setGeocode(geoData);

      // 2. Fetch parallel endpoints using the coordinates
      const { latitude, longitude, county_fips, state_fips, tract_code, zip_code } = geoData;
      const countyCode = county_fips.slice(2);

      const [
        countyAcsRes,
        tractAcsRes,
        weatherRes,
        zoningRes,
        crimeRes,
        permitsRes,
        amenitiesRes,
        trafficRes
      ] = await Promise.all([
        fetch(`/api/county-acs?county_fips=${county_fips}`),
        fetch(`/api/tract-acs?state_fips=${state_fips}&county_code=${countyCode}&tract_code=${tract_code}`),
        fetch(`/api/weather?lat=${latitude}&lon=${longitude}`),
        fetch(`/api/zoning?lat=${latitude}&lon=${longitude}`),
        fetch(`/api/crime?lat=${latitude}&lon=${longitude}&radius_miles=${crimeRadius}&zip_code=${zip_code}`),
        fetch(`/api/permits?lat=${latitude}&lon=${longitude}&radius_miles=${crimeRadius}&zip_code=${zip_code}`),
        fetch(`/api/amenities?lat=${latitude}&lon=${longitude}&radius_miles=${amenityRadius}&use_google=${useGoogle}`),
        fetch(`/api/traffic-nearby?lat=${latitude}&lon=${longitude}&radius_miles=${trafficRadius}`)
      ]);

      const [
        countyAcsData,
        tractAcsData,
        weatherData,
        zoningData,
        crimeData,
        permitsData,
        amenitiesData,
        trafficData
      ] = await Promise.all([
        countyAcsRes.json(),
        tractAcsRes.json(),
        weatherRes.json(),
        zoningRes.json(),
        crimeRes.json(),
        permitsRes.json(),
        amenitiesRes.json(),
        trafficRes.json()
      ]);

      setCountyAcs(countyAcsData);
      setTractAcs(tractAcsData);
      setWeather(weatherData);
      setZoning(zoningData);
      setCrime(crimeData);
      setPermits(permitsData);
      setAmenities(amenitiesData);
      setNearbyTraffic(trafficData);

    } catch (err: any) {
      setError(err.message || "Failed to load location intelligence data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(address);
  }, [region]); // Re-fetch when region changes

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      fetchAllData(address);
    }
  };

  const selectSample = (sample: string) => {
    setAddress(sample);
    fetchAllData(sample);
  };

  const refreshAll = () => {
    fetchAllData(address);
  };

  // Weather descriptions helper
  const getWeatherLabel = (code: number | undefined) => {
    if (code === undefined) return "Clear";
    const mapping: Record<number, string> = {
      0: "Clear",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      61: "Rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Snow",
      80: "Rain showers",
      95: "Thunderstorm",
    };
    return mapping[code] || `Code ${code}`;
  };

  // Prepare chart data for tract vs county comparison
  const getDemographicsChartData = () => {
    if (!tractAcs || !countyAcs) return [];
    return [
      {
        name: 'Median Income ($)',
        Tract: tractAcs.median_household_income || 0,
        County: countyAcs.median_household_income || 0,
      },
      {
        name: 'Median Home Value ($)',
        Tract: tractAcs.median_home_value || 0,
        County: countyAcs.median_home_value || 0,
      }
    ];
  };

  const formatCurrency = (val: number | undefined) => {
    if (!val) return "—";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number | undefined) => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & controls */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter a Texas address (e.g. 1500 Marilla St, Dallas, TX)"
              className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-sm font-medium shadow-sm transition placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              Analyze Address
            </button>
            <button
              type="button"
              onClick={refreshAll}
              disabled={isLoading}
              className="flex items-center justify-center rounded-lg border border-gray-300 p-3 text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              title="Refresh all metrics"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </form>

        {/* Sample Addresses */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Sample Searches:</span>
          {region.sample_addresses.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => selectSample(sample)}
              className="rounded-full bg-gray-100 px-3.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
            >
              Sample {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Control sliders inside an accordion/box */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-gray-500">Google Amenities</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="toggle-google"
              checked={useGoogle}
              onChange={(e) => setUseGoogle(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="toggle-google" className="text-sm font-medium text-gray-700 cursor-pointer">
              Query Google Places
            </label>
          </div>
          <p className="text-[10px] text-gray-400">Loads real Google ratings/names.</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-bold uppercase text-gray-500">Amenity Radius</label>
            <span className="text-xs font-semibold text-blue-600">{amenityRadius} mi</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={amenityRadius}
            onChange={(e) => setAmenityRadius(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-bold uppercase text-gray-500">Crime/Permit Radius</label>
            <span className="text-xs font-semibold text-blue-600">{crimeRadius} mi</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.25"
            value={crimeRadius}
            onChange={(e) => setCrimeRadius(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-bold uppercase text-gray-500">Traffic Radius</label>
            <span className="text-xs font-semibold text-blue-600">{trafficRadius} mi</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.5"
            value={trafficRadius}
            onChange={(e) => setTrafficRadius(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error loading data:</strong> {error}
        </div>
      )}

      {/* Main Analysis Panels */}
      {geocode && !isLoading && (
        <div className="space-y-8 animate-fade-in">
          {/* Header & Mini-Map Card */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm font-semibold tracking-wider uppercase">Geocoding Result</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{geocode.matched_address}</h2>
                <p className="text-sm text-gray-500 font-medium">
                  <strong>{geocode.tract_name}</strong> · {geocode.county_name} · ZIP {geocode.zip_code || "—"}
                </p>
                <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-gray-400">
                  <span>LAT: {geocode.latitude.toFixed(5)}</span>
                  <span>LON: {geocode.longitude.toFixed(5)}</span>
                  <span>FIPS: {geocode.county_fips}</span>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4 flex gap-4 text-xs font-medium text-gray-500">
                <div>Region: <span className="text-gray-900">{region.name}</span></div>
                <div>ACS vintage: <span className="text-gray-900">{region.acs_vintage}</span></div>
              </div>
            </div>

            {/* Static Canvas Map mockup */}
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 h-48 md:h-auto shadow-sm">
              <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <MapIcon className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-xs font-semibold text-gray-700">Coordinates Map View</span>
                <span className="text-[10px] font-mono text-gray-400 mt-1">Lat: {geocode.latitude.toFixed(4)}, Lon: {geocode.longitude.toFixed(4)}</span>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  <Navigation className="h-3 w-3" /> Point Intersected
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Zoning & Permits */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-600" />
              Zoning & Permits
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Zoning District"
                value={zoning?.zone_code || "N/A"}
                subtitle="City Base Code"
                icon={<Building className="h-4 w-4" />}
                badge={zoning?.land_use_category || "Unknown"}
              />
              <MetricCard
                title="Allowed Land Use"
                value={zoning?.land_use_category || "Unknown"}
                subtitle="City of Dallas base zoning"
                badge="GIS Base"
              />
              <MetricCard
                title="Permits (Nearby)"
                value={permits?.permit_count || 0}
                subtitle={`ZIP ${geocode.zip_code || "Area"}`}
                badge="10-Yr Archive"
                badgeColor="bg-amber-50 text-amber-700 border-amber-200"
              />
              <MetricCard
                title="FRED County Housing Permits"
                value={formatNumber(countyAcs?.building_permits_latest)}
                subtitle={`Year ${countyAcs?.building_permits_year || "2025"}`}
                icon={<Landmark className="h-4 w-4" />}
              />
            </div>

            {zoning?.land_use_category === "Unknown" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
                No Dallas zoning polygon at this point — likely <strong>outside Dallas city limits</strong>. 
                Zoning data covers the City of Dallas only (not Plano, Irving, Fort Worth, etc.).
              </div>
            )}

            {/* Recent Permits breakdown */}
            {permits && permits.permits && permits.permits.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Permit Activity (same ZIP)</h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {Object.entries(permits.category_breakdown || {}).map(([cat, count]) => (
                    <div key={cat} className="rounded-lg bg-gray-50 p-3">
                      <span className="text-xs text-gray-500 font-medium">{cat}</span>
                      <p className="text-lg font-bold text-gray-900 mt-1">{count}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <details className="text-xs">
                    <summary className="font-semibold text-blue-600 cursor-pointer hover:underline">
                      View recent building permits list in this ZIP
                    </summary>
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Land Use</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 font-medium">
                          {permits.permits.slice(0, 10).map((p, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 whitespace-nowrap text-gray-500">{p.issued_date ? p.issued_date.slice(0, 10) : "—"}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-gray-900">{p.permit_type}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-gray-500">{p.land_use}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-gray-900">{p.street_address}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-blue-600 font-bold">{formatCurrency(p.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Weather & Market Prices */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-gray-600" />
              Weather & Home Prices
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Current Temperature"
                value={weather ? `${weather.temp_f}°F` : "—"}
                subtitle={getWeatherLabel(weather?.weather_code)}
                badge={weather?.source}
              />
              <MetricCard
                title="Today High / Low"
                value={weather ? `${weather.high_f} / ${weather.low_f}°F` : "—"}
                subtitle="Open-Meteo"
              />
              <MetricCard
                title="Zillow ZHVI (County)"
                value={countyAcs?.zillow_zhvi ? formatCurrency(countyAcs.zillow_zhvi) : formatCurrency(countyAcs?.median_home_value)}
                subtitle="Zillow Home Value Index"
                badge="Zillow"
                badgeColor="bg-blue-50 text-blue-700 border-blue-200"
              />
              <MetricCard
                title="FHFA HPI (County)"
                value={countyAcs?.fhfa_hpi_index ? formatNumber(countyAcs.fhfa_hpi_index) : "—"}
                subtitle="FHFA Index (1990 standard)"
                badge="HPI index"
              />
            </div>
          </div>

          {/* Section 3: Demographics (ACS Census) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-gray-600" />
              Demographics (Census ACS 5-Year)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard
                title="Population (Tract)"
                value={formatNumber(tractAcs?.population)}
                subtitle="Census Tract Total"
              />
              <MetricCard
                title="Median Income (Tract)"
                value={formatCurrency(tractAcs?.median_household_income)}
                subtitle="Median Household"
              />
              <MetricCard
                title="Median Home Value (Tract)"
                value={formatCurrency(tractAcs?.median_home_value)}
                subtitle="Property estimate"
              />
              <MetricCard
                title="Median Age"
                value={tractAcs?.median_age ? `${tractAcs.median_age} yrs` : "—"}
                subtitle="Tract average"
              />
              <MetricCard
                title="College Degree+"
                value={tractAcs?.college_plus_pct ? `${tractAcs.college_plus_pct}%` : "—"}
                subtitle="Bachelors / Masters degree"
              />
            </div>

            {/* Demographics chart */}
            {tractAcs && countyAcs && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Tract vs. County Financial Comparison</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getDemographicsChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="Tract" fill="#1565C0" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="County" fill="#90CAF9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Safety & Crime */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-gray-600" />
              Safety & Local Crime
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="DPD Incidents"
                value={crime?.incident_count || 0}
                subtitle={`Within ${crimeRadius} mi radius`}
                badge="Last Year"
              />
              <MetricCard
                title="Violent Offenses"
                value={crime?.violent_count || 0}
                subtitle="Nearby incidents"
                badge="Violent"
                badgeColor="bg-red-50 text-red-700 border-red-200"
              />
              <MetricCard
                title="Property Offenses"
                value={crime?.property_count || 0}
                subtitle="Thefts, burglaries, larceny"
                badge="Property"
              />
              <MetricCard
                title="TX Violent Crime Rate"
                value={countyAcs?.violent_crime_per_100k ? formatNumber(countyAcs.violent_crime_per_100k) : "34.6"}
                subtitle="State proxy / 100K pop"
              />
            </div>
            {crime && (
              <p className="text-xs text-gray-400 mt-1">
                <strong>Source:</strong> {crime.source} — {crime.note}
              </p>
            )}

            {crime && Object.keys(crime.top_offense_types || {}).length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Nearby Offense Categories</h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {Object.entries(crime.top_offense_types).map(([off, count]) => (
                    <div key={off} className="rounded-lg bg-gray-50 p-3">
                      <span className="text-xs text-gray-500 font-medium block truncate" title={off}>{off}</span>
                      <p className="text-lg font-bold text-gray-900 mt-1">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Nearby Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-gray-600" />
              Nearby Amenities (Google Places)
            </h3>
            
            {amenities?.enabled ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Amenity Scoring Index</h4>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-blue-600">{amenities.overall_score || "—"}</span>
                      <span className="text-gray-400 font-semibold">/ 100</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 font-medium leading-relaxed">
                      This score aggregates proximity and count across 10 vital categories: grocery, pharmacy, gym, convenience, restaurant, school, hospital, park, bank, and shopping.
                    </p>
                  </div>
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <span className="text-[10px] text-gray-400 block font-mono">
                      SOURCE: {amenities.source}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Count</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Nearest (mi)</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 font-medium text-xs">
                      {amenities.categories.map((cat, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-gray-900">{cat.label}</td>
                          <td className="px-3 py-2 text-gray-500">{cat.count}</td>
                          <td className="px-3 py-2 text-gray-500">{cat.nearest_mi !== null ? `${cat.nearest_mi} mi` : "—"}</td>
                          <td className="px-3 py-2 text-blue-600 font-bold">{cat.score} / 100</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-gray-900">Google Places API Disabled</h4>
                <p className="text-xs text-gray-500 max-w-lg mx-auto mt-2 leading-relaxed">
                  {amenities?.note || "Nearby Amenities can be loaded dynamically. Please enable 'Query Google Places' in the options box to search for groceries, cafes, hospitals, parks, and other facilities nearby."}
                </p>
              </div>
            )}
          </div>

          {/* Section 6: Traffic & Mobility */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-gray-600" />
              Traffic & Mobility
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="County Mean AADT"
                value="50,050"
                subtitle="Daily vehicle count"
              />
              <MetricCard
                title="County Peak AADT"
                value="267,131"
                subtitle="Max county point count"
              />
              <MetricCard
                title="Long Commute (Tract)"
                value={tractAcs?.commute_60_plus_pct ? `${tractAcs.commute_60_plus_pct}%` : "—"}
                subtitle="Commutes longer than 60 min"
              />
            </div>

            {/* Traffic Roads list */}
            {nearbyTraffic.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Nearby Highway & Arterial Traffic (AADT)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Route</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Daily Vehicles (AADT)</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 font-medium text-xs">
                      {nearbyTraffic.slice(0, 5).map((t, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-gray-900 font-semibold">{t.route}</td>
                          <td className="px-3 py-2 text-blue-600 font-bold">{formatNumber(t.aadt)}</td>
                          <td className="px-3 py-2 text-gray-500">{t.func_class}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-700">Fetching geocoding & multi-source location intelligence...</p>
          <span className="text-xs text-gray-400 mt-1">This takes only 2–3 seconds on the Node.js backend.</span>
        </div>
      )}
    </div>
  );
};
