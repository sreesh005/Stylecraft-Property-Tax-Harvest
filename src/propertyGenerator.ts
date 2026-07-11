import fs from "fs";
import path from "path";
import { PropertyTaxRecord, PropertyHistoryEvent } from "./propertyTypes";

// Configuration from user email
export const ENTITY_COUNTY_MAP = [
  {
    entity: "Stylecraft Builders Inc",
    counties: ["Brazos", "Burleson", "Grimes", "Montgomery", "Walker", "Washington"],
    weight: 240
  },
  {
    entity: "Stylecraft Falcon Pointe LP",
    counties: ["McLennan"],
    weight: 90
  },
  {
    entity: "Stylecraft Central Texas LP",
    counties: ["Bell", "Lampasas", "Williamson", "Guadalupe"],
    weight: 160
  },
  {
    entity: "Stylecraft East Texas LLC",
    counties: ["Smith"],
    weight: 60
  },
  {
    entity: "Ranier & Son Development LLC",
    counties: ["Burleson", "Washington", "Brazos", "Walker"],
    weight: 50
  }
];

const COUNTY_CITIES: Record<string, { city: string; zip: string; taxRate: number }> = {
  Brazos: { city: "Bryan", zip: "77802", taxRate: 2.15 },
  Burleson: { city: "Caldwell", zip: "77836", taxRate: 1.85 },
  Grimes: { city: "Navasota", zip: "77868", taxRate: 1.90 },
  Montgomery: { city: "Conroe", zip: "77301", taxRate: 2.25 },
  Walker: { city: "Huntsville", zip: "77340", taxRate: 1.95 },
  Washington: { city: "Brenham", zip: "77833", taxRate: 1.75 },
  McLennan: { city: "Waco", zip: "76701", taxRate: 2.10 },
  Bell: { city: "Temple", zip: "76501", taxRate: 2.20 },
  Lampasas: { city: "Lampasas", zip: "76550", taxRate: 1.80 },
  Williamson: { city: "Georgetown", zip: "78626", taxRate: 2.30 },
  Guadalupe: { city: "Seguin", zip: "78155", taxRate: 2.05 },
  Smith: { city: "Tyler", zip: "75701", taxRate: 1.98 }
};

const STREET_NAMES = [
  "Sebright Dr", "Falcon Point Dr", "Autumn Oak Trail", "Pecan Valley", "Meadow View Lane",
  "Blueberry Hill", "Whispering Pines", "Canyon Creek", "Cedar Crest", "Stony Brook",
  "Stonegate", "Post Oak Road", "Harvest Ridge", "Brookside Lane", "Wildwood Way",
  "Deer Creek Trail", "Willow Creek", "Shady Grove", "Magnolia Springs", "Golden Oak"
];

const LEGAL_SUBDIVISIONS = [
  "GOURD CREEK PH 1", "FALCON POINT ESTS SEC 3", "SUMMER RIDGE SEC 2", "AUTUMN OAK PH 2",
  "OAKWOOD HAVEN", "PECAN VALLEY SEC 4", "SADDLE CREEK PH 5", "MAGNOLIA CROSSING SEC 1",
  "TRAILSIDE WEST PH 3", "PINE BROOK SUBDIV"
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePropertyId(): string {
  return String(Math.floor(100000 + Math.random() * 899999));
}

function generateGeoId(): string {
  const segment1 = Math.floor(100000 + Math.random() * 899999);
  const segment2 = String(Math.floor(1000 + Math.random() * 8999)).padStart(4, "0");
  const segment3 = String(Math.floor(1 + Math.random() * 999)).padStart(4, "0");
  return `${segment1}-${segment2}-${segment3}`;
}

export function generateAllProperties(): PropertyTaxRecord[] {
  const records: PropertyTaxRecord[] = [];
  let currentId = 1;

  for (const config of ENTITY_COUNTY_MAP) {
    const numToGen = config.weight;
    for (let i = 0; i < numToGen; i++) {
      const county = getRandomElement(config.counties);
      const cityConfig = COUNTY_CITIES[county] || { city: "College Station", zip: "77845", taxRate: 2.0 };
      
      const propId = generatePropertyId();
      const geoId = generateGeoId();
      const streetNum = Math.floor(100 + Math.random() * 8900);
      const street = getRandomElement(STREET_NAMES);
      const streetAddress = `${streetNum} ${street.toUpperCase()}`;
      const subdivision = getRandomElement(LEGAL_SUBDIVISIONS);
      const block = Math.floor(1 + Math.random() * 12);
      const lot = Math.floor(1 + Math.random() * 32);
      const acres = parseFloat((0.12 + Math.random() * 0.25).toFixed(3));
      const legalDescription = `${subdivision}, BLOCK ${block}, LOT ${lot}, ACRES ${acres}`;
      
      // Determine stage and status deterministically based on ID to balance them approx 1/3 each
      let stage: "rendering" | "protest" | "payment" = "rendering";
      if (currentId % 3 === 1) {
        stage = "protest";
      } else if (currentId % 3 === 2) {
        stage = "payment";
      }

      // Prior Year valuations (2025)
      // Usually raw lot or early construction in prior year
      const prior_appraised_value = Math.round(30000 + Math.random() * 35000);
      const prior_assessed_value = prior_appraised_value; // No homestead caps on builder inventory/construction

      // Protest variables (2026)
      let notice_date: string | null = null;
      let protest_deadline: string | null = null;
      let current_appraised_value: number | null = null;
      let current_assessed_value: number | null = null;
      let status = "Under CAD Review";
      let protest_filed_date: string | null = null;
      let protest_outcome_value: number | null = null;

      // Payment variables
      let tax_amount_due: number | null = null;
      let payment_status: "unpaid" | "paid" | "overdue" | "pending_protest" | null = null;

      const history: PropertyHistoryEvent[] = [
        {
          date: "2026-01-02",
          event: "Rendering Filed",
          description: `Builder inventory property tax rendering filed on behalf of ${config.entity} for tax year 2026. Prior year assessed value of $${prior_assessed_value.toLocaleString()} recorded.`,
          user: "Stacy Carter"
        }
      ];

      if (stage === "rendering") {
        status = "Rendering Filed";
        history.push({
          date: "2026-04-10",
          event: "CAD Review",
          description: "County Appraisal District acknowledged rendering receipt. Awaiting mid-year physical appraisal of construction progress.",
          user: "System"
        });
      } else if (stage === "protest") {
        // notice issued in May 2026
        const day = 1 + (currentId % 28);
        const noticeDayStr = String(day).padStart(2, "0");
        notice_date = `2026-05-${noticeDayStr}`;
        // protest is due 30 days later
        const deadlineDay = day;
        const deadlineDayStr = String(deadlineDay).padStart(2, "0");
        protest_deadline = `2026-06-${deadlineDayStr}`;

        // Construction completed or progressed, appraised values surge
        current_appraised_value = Math.round(140000 + Math.random() * 180000);
        current_assessed_value = current_appraised_value;

        // Randomize protest status
        const protestMod = currentId % 4;
        if (protestMod === 0) {
          status = "Appraisal Notice Issued";
        } else if (protestMod === 1) {
          status = "Protest Filed";
          protest_filed_date = `2026-05-${String(Math.min(day + 5, 28)).padStart(2, "0")}`;
          history.push(
            {
              date: notice_date,
              event: "Appraisal Notice Issued",
              description: `County proposed 2026 market value at $${current_appraised_value.toLocaleString()} (Structure: $${Math.round(current_appraised_value * 0.7).toLocaleString()}, Land: $${Math.round(current_appraised_value * 0.3).toLocaleString()}).`,
              user: "System"
            },
            {
              date: protest_filed_date,
              event: "Protest Filed",
              description: `Electronic property tax protest filed contesting excessive valuation and unequal appraisal. Requesting formal ARB review.`,
              user: "Stacy Carter"
            }
          );
        } else if (protestMod === 2) {
          status = "Protest Hearing Scheduled";
          protest_filed_date = `2026-05-${String(Math.min(day + 3, 28)).padStart(2, "0")}`;
          history.push(
            {
              date: notice_date,
              event: "Appraisal Notice Issued",
              description: `County proposed 2026 market value at $${current_appraised_value.toLocaleString()}.`,
              user: "System"
            },
            {
              date: protest_filed_date,
              event: "Protest Filed",
              description: "Electronic property tax protest filed contesting valuation.",
              user: "Stacy Carter"
            },
            {
              date: `2026-06-02`,
              event: "Hearing Scheduled",
              description: `Formal Appraisal Review Board (ARB) hearing scheduled for 2026-07-22 at the Central Appraisal District offices.`,
              user: "System"
            }
          );
        } else {
          status = "Protest Resolved";
          protest_filed_date = `2026-05-${String(Math.min(day + 4, 28)).padStart(2, "0")}`;
          // Protest resolved saves about 10-25%
          const savingsPct = 0.10 + (currentId % 15) / 100;
          protest_outcome_value = Math.round(current_appraised_value * (1 - savingsPct));
          current_assessed_value = protest_outcome_value; // Assessed value updated to the outcome
          
          history.push(
            {
              date: notice_date,
              event: "Appraisal Notice Issued",
              description: `County proposed 2026 market value at $${current_appraised_value.toLocaleString()}.`,
              user: "System"
            },
            {
              date: protest_filed_date,
              event: "Protest Filed",
              description: "Electronic property tax protest filed contesting valuation.",
              user: "Stacy Carter"
            },
            {
              date: `2026-06-15`,
              event: "Protest Resolved",
              description: `Settlement reached. Appraisal District agreed to reduce the appraised market value from $${current_appraised_value.toLocaleString()} to $${protest_outcome_value.toLocaleString()} (Total Savings: $${(current_appraised_value - protest_outcome_value).toLocaleString()}).`,
              user: "ARB / CAD Officer"
            }
          );
        }
      } else {
        // Payment phase (October releases)
        notice_date = `2026-05-12`;
        protest_deadline = `2026-06-11`;
        
        // Finalized valuation
        const finalVal = Math.round(150000 + Math.random() * 160000);
        current_appraised_value = finalVal;
        
        // Some had protests, some didn't
        if (currentId % 2 === 0) {
          protest_outcome_value = Math.round(finalVal * 0.85);
          current_assessed_value = protest_outcome_value;
        } else {
          current_assessed_value = finalVal;
        }

        // Calculate actual tax due
        const taxRate = cityConfig.taxRate;
        const taxDue = Math.round((current_assessed_value * taxRate) / 100);
        tax_amount_due = taxDue;

        // Payment status split: 60% paid, 30% unpaid, 10% overdue
        const payMod = currentId % 10;
        if (payMod < 6) {
          status = "Tax Paid";
          payment_status = "paid";
          history.push(
            {
              date: notice_date,
              event: "Appraisal Notice Issued",
              description: `County proposed 2026 market value at $${current_appraised_value.toLocaleString()}.`,
              user: "System"
            },
            {
              date: "2026-10-12",
              event: "Tax Statement Issued",
              description: `Final tax statement released. Assessed value: $${current_assessed_value.toLocaleString()}. Tax rate: ${taxRate}%. Annual taxes due: $${taxDue.toLocaleString()}.`,
              user: "County Tax Assessor"
            },
            {
              date: "2026-11-05",
              event: "Tax Payment Posted",
              description: `Electronic payment of $${taxDue.toLocaleString()} posted successfully. Receipt #TX-${100000 + currentId} issued.`,
              user: "Stacy Carter"
            }
          );
        } else if (payMod < 9) {
          status = "Tax Statement Issued";
          payment_status = "unpaid";
          history.push(
            {
              date: notice_date,
              event: "Appraisal Notice Issued",
              description: `County proposed 2026 market value at $${current_appraised_value.toLocaleString()}.`,
              user: "System"
            },
            {
              date: "2026-10-15",
              event: "Tax Statement Issued",
              description: `Final tax statement released. Assessed value: $${current_assessed_value.toLocaleString()}. Tax rate: ${taxRate}%. Annual taxes due: $${taxDue.toLocaleString()}. Payment deadline: January 31, 2027.`,
              user: "County Tax Assessor"
            }
          );
        } else {
          status = "Overdue";
          payment_status = "overdue";
          // Mocking it as an overdue payment from the prior tax year, or an active overdue state in the system
          tax_amount_due = Math.round(taxDue * 1.07); // With penalties & interest
          history.push(
            {
              date: notice_date,
              event: "Appraisal Notice Issued",
              description: `County proposed 2026 market value at $${current_appraised_value.toLocaleString()}.`,
              user: "System"
            },
            {
              date: "2026-10-10",
              event: "Tax Statement Issued",
              description: `Final tax statement released. Taxes due: $${taxDue.toLocaleString()}.`,
              user: "County Tax Assessor"
            },
            {
              date: "2026-12-01",
              event: "Payment Reminder Sent",
              description: "Account flagged for unpaid taxes. Property eligible for tax lien status if unpaid by February 1.",
              user: "County Tax Assessor"
            }
          );
        }
      }

      records.push({
        id: `prop_${currentId}`,
        property_id: propId,
        geo_id: geoId,
        owner_name: config.entity,
        county,
        legal_description: legalDescription,
        street_address: streetAddress,
        situs_city: cityConfig.city,
        situs_zip: cityConfig.zip,
        stage,
        status,
        prior_appraised_value,
        prior_assessed_value,
        notice_date,
        protest_deadline,
        current_appraised_value,
        current_assessed_value,
        tax_amount_due,
        payment_status,
        acres,
        year_built: 2026,
        is_under_construction: true,
        protest_filed_date,
        protest_outcome_value,
        tax_rate: cityConfig.taxRate,
        history
      });

      currentId++;
    }
  }

  return records;
}

export function loadOrCreateProperties(): PropertyTaxRecord[] {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const propertiesPath = path.join(dataDir, "properties.json");

  if (fs.existsSync(propertiesPath)) {
    try {
      const content = fs.readFileSync(propertiesPath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.error("Error reading properties.json, recreating...", err);
    }
  }

  const generated = generateAllProperties();
  fs.writeFileSync(propertiesPath, JSON.stringify(generated, null, 2), "utf-8");
  return generated;
}

export function saveProperties(properties: PropertyTaxRecord[]) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const propertiesPath = path.join(dataDir, "properties.json");
  fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2), "utf-8");
}
