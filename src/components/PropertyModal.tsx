import React, { useState } from "react";
import { X, FileText, Calendar, DollarSign, Building, MapPin, ListCollapse, History, Check, ShieldAlert } from "lucide-react";
import { PropertyTaxRecord } from "../propertyTypes";

interface PropertyModalProps {
  property: PropertyTaxRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, fields: Partial<PropertyTaxRecord>) => Promise<void>;
  onFileProtest: (id: string) => Promise<void>;
}

export function PropertyModal({ property, isOpen, onClose, onUpdate, onFileProtest }: PropertyModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "pdf" | "edit">("details");
  const [editFields, setEditFields] = useState<Partial<PropertyTaxRecord>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !property) return null;

  const handleOpenEdit = () => {
    setEditFields({
      street_address: property.street_address,
      situs_city: property.situs_city,
      situs_zip: property.situs_zip,
      legal_description: property.legal_description,
      prior_appraised_value: property.prior_appraised_value,
      prior_assessed_value: property.prior_assessed_value,
      current_appraised_value: property.current_appraised_value || undefined,
      current_assessed_value: property.current_assessed_value || undefined,
      tax_amount_due: property.tax_amount_due || undefined,
      payment_status: property.payment_status || undefined,
      notes: property.notes || ""
    });
    setActiveTab("edit");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate(property.id, editFields);
      setActiveTab("details");
    } catch (err) {
      console.error("Failed to update property", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProtestClick = async () => {
    setIsSaving(true);
    try {
      await onFileProtest(property.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentAppraised = property.current_appraised_value || 0;
  const currentAssessed = property.current_assessed_value || 0;
  const priorAppraised = property.prior_appraised_value;
  const priorAssessed = property.prior_assessed_value;
  const valueIncrease = currentAppraised ? currentAppraised - priorAppraised : 0;
  const valueIncreasePct = currentAppraised ? (valueIncrease / priorAppraised) * 100 : 0;

  return (
    <div id="property-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="property-modal-content" className="relative flex flex-col w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold tracking-tight">Property ID {property.property_id}</h2>
              <p className="text-xs text-slate-400 font-mono tracking-wider">{property.county.toUpperCase()} COUNTY CAD</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Stage Badge */}
            <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md tracking-wider ${
              property.stage === "payment" 
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                : property.stage === "protest"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}>
              {property.stage} Stage
            </span>
            <button 
              id="close-modal-btn"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            id="tab-details"
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === "details"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <ListCollapse className="h-4 w-4" />
            Property Details
          </button>
          
          <button
            id="tab-pdf"
            disabled={!property.current_appraised_value}
            onClick={() => setActiveTab("pdf")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              !property.current_appraised_value
                ? "opacity-50 cursor-not-allowed text-slate-300"
                : activeTab === "pdf"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-4 w-4" />
            Notice PDF Viewer
          </button>

          <button
            id="tab-edit"
            onClick={handleOpenEdit}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === "edit"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            Edit Fields
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: DETAILS */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Metrics & Information */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Property Summary Header */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase block mb-1">OWNER ENTITY</span>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{property.owner_name}</h3>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {property.street_address}, {property.situs_city}, TX {property.situs_zip}
                    </span>
                    <span className="h-3 w-px bg-slate-200 hidden sm:inline" />
                    <span className="font-semibold text-slate-700">County: {property.county}</span>
                  </div>
                </div>

                {/* Values Comparison Table */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historical Appraisal comparison</h4>
                    {valueIncrease > 0 && (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Value up +{valueIncreasePct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prior Year Appraised (2025)</p>
                      <p className="text-xl font-bold text-slate-800">${priorAppraised.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prior Year Assessed (2025)</p>
                      <p className="text-xl font-bold text-slate-800">${priorAssessed.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-slate-900 text-white p-4 rounded-lg">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Proposed Appraised</p>
                      <p className="text-xl font-black text-indigo-400">
                        {currentAppraised ? `$${currentAppraised.toLocaleString()}` : "Pending CAD"}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Year Assessed (2026)</p>
                      <p className="text-xl font-bold text-slate-800">
                        {currentAssessed ? `$${currentAssessed.toLocaleString()}` : "Pending CAD"}
                      </p>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100/50">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Estimated Tax Rate</p>
                      <p className="text-xl font-bold text-indigo-900">{property.tax_rate ? `${property.tax_rate}%` : "2.0%"}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tax Amount Due</p>
                      <p className="text-xl font-bold text-slate-800">
                        {property.tax_amount_due ? `$${property.tax_amount_due.toLocaleString()}` : "TBD (Oct Release)"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action bar for Protest inside Details */}
                  {property.stage === "protest" && property.status === "Appraisal Notice Issued" && (
                    <div className="bg-amber-50/70 border-t border-amber-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Protest Deadline Approaching</p>
                          <p className="text-[10px] text-slate-500 font-mono">Request protest before {property.protest_deadline}</p>
                        </div>
                      </div>
                      <button
                        id="modal-file-protest-btn"
                        onClick={handleProtestClick}
                        className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        File Protest Now
                      </button>
                    </div>
                  )}
                </div>

                {/* More Metadata Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Legal Description</span>
                    <p className="text-xs text-slate-700 font-semibold leading-relaxed">{property.legal_description}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Situs Details</span>
                      <p className="text-xs text-slate-700 font-semibold">{property.situs_city}, TX {property.situs_zip}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acres</span>
                        <p className="text-xs text-slate-700 font-semibold">{property.acres} ac</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            property.status.includes("Resolved") || property.status.includes("Paid") ? "bg-emerald-500" : "bg-amber-500"
                          }`} />
                          {property.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {property.notes && (
                  <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50">
                    <span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase block mb-1">Internal Notes</span>
                    <p className="text-xs text-slate-700">{property.notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Log Timeline */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <History className="h-4 w-4 text-slate-500" />
                  Transaction Log & History
                </h4>
                
                <div className="flex-1 space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {property.history.map((event, idx) => (
                    <div key={idx} className="relative pl-5 border-l border-slate-200 pb-1">
                      {/* Timeline dot */}
                      <span className="absolute left-[-4.5px] top-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-indigo-600 font-mono">{event.date}</span>
                        {event.user && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1 py-0.2 rounded font-mono">{event.user}</span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 mb-0.5">{event.event}</h5>
                      <p className="text-[11px] text-slate-500 leading-normal">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTICE PDF VISUALIZER */}
          {activeTab === "pdf" && property.current_appraised_value && (
            <div className="bg-white p-8 border border-slate-300 rounded-xl max-w-2xl mx-auto shadow-md font-sans text-slate-800">
              {/* Document Header */}
              <div className="flex justify-between border-b-2 border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase">2026 Notice of Appraised Value</h3>
                  <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">{property.county.toUpperCase()} CENTRAL APPRAISAL DISTRICT</p>
                  <p className="text-[11px] text-slate-500">TEXAS CENTRAL PORTAL | WWW.TEXASCADS.ORG</p>
                </div>
                <div className="text-right border border-slate-800 p-2 text-xs font-bold max-w-[200px]">
                  <p className="text-red-600 uppercase text-[10px] font-black tracking-tight leading-tight">Do Not Pay From This Notice</p>
                  <p className="text-[9px] text-slate-500 font-normal mt-0.5">This is NOT a tax statement. This notice outlines the CAD proposed appraisal value for the current tax cycle.</p>
                </div>
              </div>

              {/* Top Meta Box */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 mb-4 text-[11px]">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Property ID:</span>
                    <span className="font-bold font-mono bg-yellow-100 px-1">{property.property_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Geo ID:</span>
                    <span className="font-bold font-mono">{property.geo_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Ownership %:</span>
                    <span className="font-semibold">100.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Legal Description:</span>
                    <span className="font-semibold truncate max-w-[180px]" title={property.legal_description}>{property.legal_description}</span>
                  </div>
                </div>
                
                <div className="space-y-1 border-l border-slate-200 pl-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Date of Notice:</span>
                    <span className="font-bold font-mono bg-yellow-100 px-1">{property.notice_date || "May 06, 2026"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Situs:</span>
                    <span className="font-bold">{property.street_address} {property.situs_city}, TX</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Acres:</span>
                    <span className="font-semibold">{property.acres}</span>
                  </div>
                  <div className="flex justify-between bg-yellow-100 px-1 border border-yellow-300 rounded font-bold text-amber-900">
                    <span>Protest Deadline:</span>
                    <span>{property.protest_deadline || "June 05, 2026"}</span>
                  </div>
                </div>
              </div>

              {/* Owner Box */}
              <div className="border border-slate-200 p-3 rounded mb-4 text-[11px] bg-slate-50">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Owner Address</p>
                <p className="font-bold text-slate-800">{property.owner_name}</p>
                <p className="text-slate-600">4090 STATE HIGHWAY 6 S</p>
                <p className="text-slate-600">COLLEGE STATION, TX 77845-8962</p>
              </div>

              {/* Valuation Notice Grid */}
              <div className="border border-slate-800 overflow-hidden mb-4">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-[10px] uppercase">
                      <th className="p-2 border-r border-slate-700">Appraisal Information</th>
                      <th className="p-2 border-r border-slate-700 text-right">Last Year - 2025</th>
                      <th className="p-2 text-right">Proposed - 2026</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-medium">Structure / Improvement Market Value</td>
                      <td className="p-2 text-right text-slate-500">$0</td>
                      <td className="p-2 text-right font-semibold">${Math.round(currentAppraised * 0.75).toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-medium">Market Value of Non-Ag/Timber Land</td>
                      <td className="p-2 text-right text-slate-500">${priorAppraised.toLocaleString()}</td>
                      <td className="p-2 text-right font-semibold">${Math.round(currentAppraised * 0.25).toLocaleString()}</td>
                    </tr>
                    <tr className="border-b-2 border-slate-800 bg-slate-100 font-bold">
                      <td className="p-2">Total Market Value</td>
                      <td className="p-2 text-right text-slate-600 font-semibold bg-yellow-100/50">${priorAppraised.toLocaleString()}</td>
                      <td className="p-2 text-right text-slate-900 bg-yellow-100">${currentAppraised.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-medium">Appraised Value</td>
                      <td className="p-2 text-right text-slate-600 font-semibold bg-yellow-100/50">${priorAppraised.toLocaleString()}</td>
                      <td className="p-2 text-right text-slate-900 bg-yellow-100 font-bold">${currentAppraised.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-2 text-slate-700">2026 Proposed Taxable Value</td>
                      <td className="p-2 text-right text-slate-500 font-normal">${priorAssessed.toLocaleString()}</td>
                      <td className="p-2 text-right text-slate-900 bg-yellow-100">${currentAssessed.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Explanatory text */}
              <div className="text-[9px] text-slate-500 leading-relaxed mb-4 border-t border-dotted border-slate-300 pt-3">
                <p className="font-bold uppercase mb-1">Dear Property Owner,</p>
                <p>We have appraised the property listed above for the tax year 2026. As of January 1, our appraisal is outlined above. The Texas Legislature does not set the amount of your local taxes. Your property tax burden is decided by your locally elected officials, and all inquiries concerning your taxes should be directed to those officials.</p>
                <p className="mt-1">If you disagree with the proposed value, you have the right to file a protest with the Appraisal Review Board (ARB). The deadline to file your protest is 30 days from the date of notice shown above (<b>{property.protest_deadline}</b>).</p>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200 text-xs font-bold text-slate-800">
                <span>PDF Verification Hash: SHA-256/TX-{property.id}</span>
                <span className="text-indigo-600 font-mono uppercase text-[10px]">Stacy's File Auditor Approved</span>
              </div>
            </div>
          )}

          {/* TAB 3: EDIT FIELDS */}
          {activeTab === "edit" && (
            <form onSubmit={handleSaveEdit} className="space-y-4 max-w-xl mx-auto bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Manual Data override</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editFields.street_address || ""}
                    onChange={e => setEditFields({ ...editFields, street_address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={editFields.situs_city || ""}
                    onChange={e => setEditFields({ ...editFields, situs_city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={editFields.situs_zip || ""}
                    onChange={e => setEditFields({ ...editFields, situs_zip: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Legal Description</label>
                  <textarea
                    rows={2}
                    value={editFields.legal_description || ""}
                    onChange={e => setEditFields({ ...editFields, legal_description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Prior Appraised (2025)</label>
                  <input
                    type="number"
                    value={editFields.prior_appraised_value || ""}
                    onChange={e => setEditFields({ ...editFields, prior_appraised_value: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Prior Assessed (2025)</label>
                  <input
                    type="number"
                    value={editFields.prior_assessed_value || ""}
                    onChange={e => setEditFields({ ...editFields, prior_assessed_value: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Proposed Appraised (2026)</label>
                  <input
                    type="number"
                    value={editFields.current_appraised_value || ""}
                    onChange={e => setEditFields({ ...editFields, current_appraised_value: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                    placeholder="Pending Scraper..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Proposed Assessed (2026)</label>
                  <input
                    type="number"
                    value={editFields.current_assessed_value || ""}
                    onChange={e => setEditFields({ ...editFields, current_assessed_value: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                    placeholder="Pending Scraper..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tax Amount Due ($)</label>
                  <input
                    type="number"
                    value={editFields.tax_amount_due || ""}
                    onChange={e => setEditFields({ ...editFields, tax_amount_due: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                    placeholder="TBD (Oct Statement)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Payment Status</label>
                  <select
                    value={editFields.payment_status || ""}
                    onChange={e => setEditFields({ ...editFields, payment_status: (e.target.value || null) as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                  >
                    <option value="">N/A</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="pending_protest">Pending Protest Decision</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Auditor Notes</label>
                  <textarea
                    rows={2}
                    value={editFields.notes || ""}
                    onChange={e => setEditFields({ ...editFields, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-indigo-500"
                    placeholder="Type notes..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  id="save-edit-property-btn"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSaving ? "Saving..." : <><Check className="h-4 w-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
