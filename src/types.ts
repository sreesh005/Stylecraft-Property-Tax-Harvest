export interface RegionConfig {
  name: string;
  metro_name?: string;
  description: string;
  state_fips: string;
  state_abbr: string;
  county_fips: string;
  county_name: string;
  county_code: number;
  acs_vintage: string;
  sample_addresses: string[];
  open_data?: {
    crime_incidents_url: string;
    building_permits_url: string;
    zoning_map_server: string;
  };
}

export interface GeocodeResult {
  input_address: string;
  matched_address: string;
  latitude: number;
  longitude: number;
  county_fips: string;
  county_name: string;
  tract_fips: string;
  tract_name: string;
  block_group: string;
  state_fips: string;
  zip_code: string;
  city: string;
  tract_code: string;
}

export interface CountyAcsData {
  county_fips: string;
  county_name: string;
  population: number;
  median_household_income: number;
  median_home_value: number;
  source: string;
  zillow_zhvi?: number;
  fhfa_hpi_index?: number;
  building_permits_latest?: number;
  building_permits_year?: number;
  violent_crime_per_100k?: number;
  property_crime_per_100k?: number;
}

export interface TractAcsData {
  tract_fips: string;
  tract_code: string;
  name: string;
  acs_vintage: string;
  source: string;
  population: number;
  median_age: number;
  median_household_income: number;
  households: number;
  median_home_value: number;
  housing_units_total: number;
  owner_occupied: number;
  renter_occupied: number;
  commuters_total: number;
  commute_60_plus_min: number;
  education_universe: number;
  bachelors_degree: number;
  masters_degree: number;
  commute_60_plus_pct?: number;
  owner_occupied_pct?: number;
  renter_occupied_pct?: number;
  bachelors_pct?: number;
  masters_pct?: number;
  college_plus_pct?: number;
}

export interface WeatherData {
  temp_f: number;
  humidity_pct: number;
  precip_in: number;
  wind_mph: number;
  weather_code: number;
  high_f: number;
  low_f: number;
  precip_today_in: number;
  source: string;
}

export interface ZoningData {
  zone_code: string | null;
  zone_label: string | null;
  land_use_category: string;
  source: string;
  note: string | null;
}

export interface CrimeData {
  incident_count: number;
  violent_count: number;
  property_count: number;
  lookback_days: number;
  radius_miles: number;
  top_offense_types: Record<string, number>;
  incidents: Array<{
    incidentnum: string;
    offincident: string;
    nibrs_crime_category: string;
    reporteddate: string;
    zip_code: string;
    _distance_mi: number;
    _latitude: number;
    _longitude: number;
  }>;
  source: string;
  note: string;
}

export interface Permit {
  issued_date: string;
  permit_type: string;
  land_use: string;
  _land_use_category: string;
  street_address: string;
  value: number;
  work_description: string;
  _distance_mi: number | null;
}

export interface PermitsData {
  permit_count: number;
  radius_miles: number;
  permits: Permit[];
  category_breakdown: Record<string, number>;
  land_use_breakdown: Record<string, number>;
  source: string;
  note: string;
}

export interface AmenityPlace {
  name: string;
  place_type: string;
  distance_mi: number;
  rating: number | null;
  latitude: number;
  longitude: number;
}

export interface AmenityCategory {
  type: string;
  label: string;
  count: number;
  nearest_mi: number | null;
  score: number;
}

export interface AmenitiesData {
  enabled: boolean;
  source: string;
  note: string;
  radius_miles: number;
  categories: AmenityCategory[];
  overall_score: number | null;
  places: AmenityPlace[];
}

export interface TractScorecardRow {
  tract_fips: string;
  tract_name: string;
  latitude: number;
  longitude: number;
  tract_code: string;
  nearby_max_aadt: number;
  tract_label: string;
  population: number;
  median_household_income: number;
  pct_2plus_vehicles: number;
  college_plus_pct: number;
  site_score?: number; // computed client-side after ranking
}
