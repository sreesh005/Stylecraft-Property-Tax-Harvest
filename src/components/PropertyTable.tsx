import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp, Eye, FileText, ArrowRight, ShieldAlert, BadgeCent } from "lucide-react";
import { PropertyTaxRecord, PropertyStage } from "../propertyTypes";

interface PropertyTableProps {
  properties: PropertyTaxRecord[];
  stageFilter?: PropertyStage;
  onSelectProperty: (property: PropertyTaxRecord) => void;
  onBulkProtest?: (ids: string[]) => void;
}

type SortField = "property_id" | "owner_name" | "county" | "street_address" | "prior_appraised_value" | "current_appraised_value" | "status";
type SortOrder = "asc" | "desc";

export function PropertyTable({ properties, stageFilter, onSelectProperty, onBulkProtest }: PropertyTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [selectedOwner, setSelectedOwner] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [sortField, setSortField] = useState<SortField>("property_id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Unique lists for dropdown filters
  const counties = Array.from(new Set(properties.map(p => p.county))).sort();
  const owners = Array.from(new Set(properties.map(p => p.owner_name))).sort();
  const statuses = Array.from(new Set(properties.map(p => p.status))).sort();

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Filter properties
  const filteredProperties = properties.filter((prop) => {
    // 2. Text Search
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      prop.property_id.toLowerCase().includes(searchLower) ||
      prop.owner_name.toLowerCase().includes(searchLower) ||
      prop.street_address.toLowerCase().includes(searchLower) ||
      prop.legal_description.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // 3. County Dropdown
    if (selectedCounty !== "all" && prop.county !== selectedCounty) return false;

    // 4. Owner Dropdown
    if (selectedOwner !== "all" && prop.owner_name !== selectedOwner) return false;

    // 5. Status Dropdown
    if (statusFilter !== "all" && prop.status !== statusFilter) return false;

    return true;
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    let valA: any = a[sortField as keyof PropertyTaxRecord] ?? "";
    let valB: any = b[sortField as keyof PropertyTaxRecord] ?? "";

    if (typeof valA === "string") {
      return sortOrder === "asc" 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    } else {
      return sortOrder === "asc"
        ? (valA > valB ? 1 : -1)
        : (valB > valA ? 1 : -1);
    }
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedProperties.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProperties = sortedProperties.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select only eligible for protests (status is Notice Issued)
      const eligible = paginatedProperties
        .filter(p => p.status === "Appraisal Notice Issued")
        .map(p => p.id);
      setSelectedIds(eligible);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  const handleBulkProtestClick = () => {
    if (onBulkProtest && selectedIds.length > 0) {
      onBulkProtest(selectedIds);
      setSelectedIds([]);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" 
      ? <ChevronUp className="h-3.5 w-3.5" /> 
      : <ChevronDown className="h-3.5 w-3.5" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Filters header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Text Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Prop ID, Owner, Street Address, Legal..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 bg-white placeholder-slate-400 focus:outline-indigo-500 focus:border-indigo-500 shadow-2xs transition"
            />
          </div>
          
          {/* Dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:w-auto">
            <select
              value={selectedCounty}
              onChange={(e) => { setSelectedCounty(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border rounded-xl text-[11px] font-semibold text-slate-600 bg-white focus:outline-indigo-500 shadow-2xs"
            >
              <option value="all">All Counties ({counties.length})</option>
              {counties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedOwner}
              onChange={(e) => { setSelectedOwner(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border rounded-xl text-[11px] font-semibold text-slate-600 bg-white focus:outline-indigo-500 shadow-2xs max-w-[150px] sm:max-w-none truncate"
            >
              <option value="all">All Entities</option>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="col-span-2 md:col-span-1 px-3 py-2 border rounded-xl text-[11px] font-semibold text-slate-600 bg-white focus:outline-indigo-500 shadow-2xs"
            >
              <option value="all">All Statuses ({statuses.length})</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Stage description & Bulk actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Stylecraft Active Property Tax Portfolio
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Monitor prior year valuations, current year appraisals, tax rates, projected tax liabilities, and pending protests.
            </span>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-1 rounded">
                {selectedIds.length} properties selected
              </span>
              <button
                id="bulk-protest-btn"
                onClick={handleBulkProtestClick}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Bulk File Protest
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid-based Table viewport */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider select-none text-[10px]">
              <th className="p-4 w-10 text-center">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  className="rounded text-indigo-600 focus:ring-indigo-500" 
                />
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("property_id")}>
                <div className="flex items-center gap-1">Property ID {renderSortIndicator("property_id")}</div>
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("owner_name")}>
                <div className="flex items-center gap-1">Owner Entity {renderSortIndicator("owner_name")}</div>
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("county")}>
                <div className="flex items-center gap-1">County {renderSortIndicator("county")}</div>
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("street_address")}>
                <div className="flex items-center gap-1">Street Address {renderSortIndicator("street_address")}</div>
              </th>
              <th className="p-4 cursor-pointer text-right hover:bg-slate-100" onClick={() => handleSort("prior_appraised_value")}>
                <div className="flex items-center justify-end gap-1">2025 Prior Val {renderSortIndicator("prior_appraised_value")}</div>
              </th>
              <th className="p-4 cursor-pointer text-right hover:bg-slate-100" onClick={() => handleSort("current_appraised_value")}>
                <div className="flex items-center justify-end gap-1">2026 Appraised {renderSortIndicator("current_appraised_value")}</div>
              </th>
              <th className="p-4 text-right">Tax Rate</th>
              <th className="p-4 text-right">Projected Tax</th>
              <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-1">Status {renderSortIndicator("status")}</div>
              </th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProperties.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400 font-medium font-mono">
                  No properties matched search or filter bounds.
                </td>
              </tr>
            ) : (
              paginatedProperties.map((prop) => {
                const isSelected = selectedIds.includes(prop.id);
                const canProtest = prop.status === "Appraisal Notice Issued";
                const taxRate = prop.tax_rate ?? 2.0;
                const projectedTax = prop.current_appraised_value 
                  ? Math.round((prop.current_appraised_value * taxRate) / 100) 
                  : Math.round((prop.prior_appraised_value * taxRate) / 100);

                return (
                  <tr 
                    key={prop.id} 
                    className="hover:bg-slate-50/50 cursor-pointer transition font-semibold text-slate-700"
                    onClick={() => onSelectProperty(prop)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        disabled={!canProtest}
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(prop.id, e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed" 
                      />
                    </td>
                    <td className="p-4 font-mono text-[11px] text-indigo-600">{prop.property_id}</td>
                    <td className="p-4 truncate max-w-[150px]" title={prop.owner_name}>{prop.owner_name}</td>
                    <td className="p-4 text-slate-500 font-bold">{prop.county}</td>
                    <td className="p-4 truncate max-w-[180px]">{prop.street_address}</td>
                    <td className="p-4 text-right text-slate-600">${prop.prior_appraised_value.toLocaleString()}</td>
                    <td className="p-4 text-right text-slate-900 font-bold">
                      {prop.current_appraised_value ? `$${prop.current_appraised_value.toLocaleString()}` : <span className="text-slate-400 font-normal italic">—</span>}
                    </td>
                    <td className="p-4 text-right text-slate-500">{taxRate}%</td>
                    <td className="p-4 text-right text-slate-900 font-bold">${projectedTax.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                        prop.status.includes("Paid") || prop.status.includes("Resolved")
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : prop.status.includes("Filed") || prop.status.includes("Scheduled")
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {prop.status}
                      </span>
                    </td>
                    
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectProperty(prop)}
                        className="p-1.5 hover:bg-slate-100 text-indigo-600 hover:text-indigo-900 rounded-lg transition"
                        title="Review details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Showing <span className="font-bold text-slate-700">{filteredProperties.length === 0 ? 0 : startIndex + 1}</span> to{" "}
          <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, filteredProperties.length)}</span> of{" "}
          <span className="font-bold text-slate-700">{filteredProperties.length}</span> properties
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border rounded-lg hover:bg-white text-slate-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition shadow-3xs"
          >
            Prev
          </button>
          
          <span className="font-mono text-slate-500 font-semibold bg-white border px-2.5 py-1 rounded-lg">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border rounded-lg hover:bg-white text-slate-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition shadow-3xs"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
