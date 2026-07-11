export interface PropertyHistoryEvent {
  date: string;
  event: string;
  description: string;
  user?: string;
}

export type PropertyStage = "rendering" | "protest" | "payment";

export interface PropertyTaxRecord {
  id: string; // unique database ID
  property_id: string; // CAD Property ID, e.g., "456490"
  geo_id: string; // CAD Geo ID, e.g., "299550-0104-0040"
  owner_name: string; // Legal entity name
  county: string; // Brazos, Burleson, Grimes, etc.
  legal_description: string; // Full CAD legal description
  street_address: string; // Situs Street address
  situs_city: string;
  situs_zip: string;
  
  // Tracking State
  stage: PropertyStage;
  status: string; // e.g., "Under CAD Review", "Appraisal Notice Issued", "Protest Filed", "Protest Hearing Scheduled", "Protest Resolved", "Tax Statement Issued", "Tax Paid", etc.
  
  // 1. Rendering phase (Prior Year 2025 values)
  prior_appraised_value: number;
  prior_assessed_value: number;
  
  // 2. Protest phase (Proposed 2026 values)
  notice_date: string | null; // Date of Notice, e.g. "2026-05-06"
  protest_deadline: string | null; // Protest deadline, e.g. "2026-06-05"
  current_appraised_value: number | null; // Total Proposed Appraised Value
  current_assessed_value: number | null; // Proposed Taxable/Assessed Value
  
  // 3. Payment phase (Tax dues and settlements)
  tax_amount_due: number | null;
  payment_status: "unpaid" | "paid" | "overdue" | "pending_protest" | null;
  
  // Additional technical data
  acres: number;
  year_built: number;
  is_under_construction: boolean;
  protest_filed_date?: string | null;
  protest_outcome_value?: number | null; // Saved assessed value after protest
  tax_rate?: number; // Texas tax rate in %
  notes?: string;
  history: PropertyHistoryEvent[];
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export interface ScraperSession {
  id: string;
  active: boolean;
  currentCounty: string;
  currentEntity: string;
  progress: number; // 0 to 100
  totalProcessed: number;
  totalFound: number;
  logs: ScraperLog[];
}

export interface DashboardMetrics {
  totalProperties: number;
  renderingCount: number;
  protestCount: number;
  paymentCount: number;
  activeProtests: number;
  resolvedProtestsCount: number;
  totalTaxDue: number;
  totalTaxPaid: number;
  totalTaxUnpaid: number;
  estimatedSavings: number; // Protest savings
}
