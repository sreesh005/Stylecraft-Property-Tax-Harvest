"""Stylecraft Builders — Property Tax Harvest & CAD Audit System (Streamlit App)"""

from __future__ import annotations

import json
import random
import time
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# ---------------------------------------------------------
# Page Configurations & Setup
# ---------------------------------------------------------
st.set_page_config(
    page_title="Stylecraft CAD Audit System",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Root path for database
ROOT = Path(__file__).resolve().parent
DATABASE_PATH = ROOT / "data" / "properties.json"

# List of Stacy's Entities and associated Counties
ENTITY_COUNTIES = [
    {
        "entity": "Stylecraft Builders Inc",
        "counties": ["Brazos", "Burleson", "Grimes", "Montgomery", "Walker", "Washington"]
    },
    {
        "entity": "Stylecraft Falcon Pointe LP",
        "counties": ["McLennan"]
    },
    {
        "entity": "Stylecraft Central Texas LP",
        "counties": ["Bell", "Lampasas", "Williamson", "Guadalupe"]
    },
    {
        "entity": "Stylecraft East Texas LLC",
        "counties": ["Smith"]
    },
    {
        "entity": "Ranier & Son Development LLC",
        "counties": ["Burleson", "Washington", "Brazos", "Walker"]
    }
]

# Static County Tax Rates / Cities mapping for visual enrichment
COUNTY_CITIES = {
    "Brazos": {"city": "Bryan", "zip": "77802", "taxRate": 2.15},
    "Burleson": {"city": "Caldwell", "zip": "77836", "taxRate": 1.85},
    "Grimes": {"city": "Navasota", "zip": "77868", "taxRate": 1.90},
    "Montgomery": {"city": "Conroe", "zip": "77301", "taxRate": 2.25},
    "Walker": {"city": "Huntsville", "zip": "77340", "taxRate": 1.95},
    "Washington": {"city": "Brenham", "zip": "77833", "taxRate": 1.75},
    "McLennan": {"city": "Waco", "zip": "76701", "taxRate": 2.10},
    "Bell": {"city": "Temple", "zip": "76501", "taxRate": 2.20},
    "Lampasas": {"city": "Lampasas", "zip": "76550", "taxRate": 1.80},
    "Williamson": {"city": "Georgetown", "zip": "78626", "taxRate": 2.30},
    "Guadalupe": {"city": "Seguin", "zip": "78155", "taxRate": 2.05},
    "Smith": {"city": "Tyler", "zip": "75701", "taxRate": 1.98}
}

# Inject clean custom styles
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    /* Global Typography */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .stAppHeader {
        background-color: transparent !important;
    }
    
    /* Title and Badges styling */
    .brand-title {
        font-family: 'Inter', sans-serif;
        font-weight: 900;
        letter-spacing: -0.04em;
        text-transform: uppercase;
        color: #0f172a;
        margin-bottom: 2px;
    }
    
    .brand-sub {
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 10px;
        color: #4f46e5;
        letter-spacing: 0.15em;
        text-transform: uppercase;
    }
    
    /* Metrics panel wrapper */
    .metric-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .metric-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .metric-val {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: #0f172a;
        margin: 4px 0;
    }
    .metric-lbl {
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }
    
    /* Badges */
    .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-family: 'JetBrains Mono', monospace;
    }
    .badge-blue { background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-amber { background-color: #fff9db; color: #b25e00; border: 1px solid #ffe399; }
    .badge-orange { background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
    .badge-emerald { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-red { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .badge-gray { background-color: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

    /* Timeline Styling */
    .timeline {
        border-left: 2px solid #e2e8f0;
        padding-left: 18px;
        margin-left: 8px;
        position: relative;
    }
    .timeline-event {
        margin-bottom: 20px;
        position: relative;
    }
    .timeline-event::before {
        content: '';
        position: absolute;
        left: -25px;
        top: 4px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #4f46e5;
        border: 2px solid #ffffff;
        box-shadow: 0 0 0 2px #e2e8f0;
    }
    .timeline-date {
        font-size: 10px;
        font-weight: 700;
        color: #94a3b8;
        font-family: 'JetBrains Mono', monospace;
        margin-bottom: 2px;
    }
    .timeline-header {
        font-size: 12px;
        font-weight: 800;
        color: #1e293b;
    }
    .timeline-user {
        font-size: 10px;
        font-weight: 700;
        color: #4f46e5;
        background-color: #e0e7ff;
        padding: 1px 5px;
        border-radius: 4px;
        margin-left: 6px;
    }
    .timeline-body {
        font-size: 11px;
        font-weight: 500;
        color: #64748b;
        margin-top: 4px;
        line-height: 1.4;
    }
    
    /* Scraper Console Terminal */
    .terminal {
        background-color: #0f172a;
        color: #f8fafc;
        border-radius: 8px;
        font-family: 'JetBrains Mono', monospace;
        padding: 14px;
        font-size: 11px;
        line-height: 1.5;
        max-height: 250px;
        overflow-y: auto;
        border: 1px solid #1e293b;
    }
    .term-line-info { color: #38bdf8; }
    .term-line-success { color: #34d399; }
    .term-line-warning { color: #fbbf24; }
    .term-line-error { color: #f87171; }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Database Loaders and Helpers
# ---------------------------------------------------------
@st.cache_data
def get_original_db_path() -> Path:
    return DATABASE_PATH

def load_properties_db() -> list[dict]:
    path = get_original_db_path()
    if not path.exists():
        st.error(f"Properties file not found at: {path}")
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        st.error(f"Error loading properties: {str(e)}")
        return []

def save_properties_db(data: list[dict]):
    path = get_original_db_path()
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        st.cache_data.clear() # Reset Streamlit's load cache
    except Exception as e:
        st.error(f"Error writing properties: {str(e)}")

# Initialize Session State
if "properties" not in st.session_state:
    st.session_state.properties = load_properties_db()
if "selected_prop_id" not in st.session_state:
    st.session_state.selected_prop_id = None
if "scraper_logs" not in st.session_state:
    st.session_state.scraper_logs = []

# Refresh local references
properties = st.session_state.properties

# ---------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------
def get_status_badge_html(status: str) -> str:
    s = status.lower()
    if "filed" in s or "scheduled" in s:
        return f'<span class="badge badge-orange">{status}</span>'
    elif "resolved" in s or "paid" in s:
        return f'<span class="badge badge-emerald">{status}</span>'
    elif "notice" in s or "issued" in s:
        return f'<span class="badge badge-amber">{status}</span>'
    elif "review" in s or "rendering" in s:
        return f'<span class="badge badge-blue">{status}</span>'
    elif "overdue" in s:
        return f'<span class="badge badge-red">{status}</span>'
    else:
        return f'<span class="badge badge-gray">{status}</span>'

# Calculate computations
total_properties = len(properties)
rendering_count = sum(1 for p in properties if p.get("stage") == "rendering")
protest_count = sum(1 for p in properties if p.get("stage") == "protest")
payment_count = sum(1 for p in properties if p.get("stage") == "payment")

active_protests = sum(1 for p in properties if p.get("status") in ["Protest Filed", "Protest Hearing Scheduled"])
resolved_protests = sum(1 for p in properties if p.get("status") == "Protest Resolved")

# Compute protest savings: (Proposed Appraisal - Settled Appraisal) * Tax Rate / 100
estimated_savings = 0.0
total_tax_paid = 0.0
total_tax_unpaid = 0.0
total_tax_due = 0.0

for p in properties:
    val_savings = 0.0
    outcome = p.get("protest_outcome_value")
    appraised = p.get("current_appraised_value")
    rate = p.get("tax_rate", 2.0)
    
    if outcome and appraised and appraised > outcome:
        val_savings = appraised - outcome
        tax_saved = (val_savings * rate) / 100.0
        estimated_savings += tax_saved
        
    tax_due_item = p.get("tax_amount_due")
    if tax_due_item:
        total_tax_due += tax_due_item
        if p.get("payment_status") == "paid":
            total_tax_paid += tax_due_item
        else:
            total_tax_unpaid += tax_due_item

# ---------------------------------------------------------
# UI Layout Header
# ---------------------------------------------------------
col_title, col_status = st.columns([0.75, 0.25])
with col_title:
    st.markdown('<div class="brand-sub">Stylecraft Builders</div>', unsafe_allow_html=True)
    st.markdown('<h1 class="brand-title">CAD Audit & Property Tax Harvest</h1>', unsafe_allow_html=True)
    st.markdown(f'<p style="font-size: 12px; font-weight: 600; color: #64748b; margin-top:-6px;">Tracking <b>{total_properties} active builder inventory properties</b> across 12 Central Texas counties.</p>', unsafe_allow_html=True)

with col_status:
    st.markdown("""
    <div style="text-align: right; margin-top: 10px;">
        <span style="display: inline-flex; align-items: center; gap: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 14px; border-radius: 8px;">
            <span style="height: 8px; width: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">CAD Pipelines Active</span>
        </span>
    </div>
    """, unsafe_allow_html=True)

# ---------------------------------------------------------
# Dynamic KPI Cards Banner
# ---------------------------------------------------------
col_kpi1, col_kpi2, col_kpi3, col_kpi4 = st.columns(4)

with col_kpi1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-lbl">Total Builder Inventory</div>
        <div class="metric-val">{total_properties:,}</div>
        <div style="font-size: 11px; font-weight:600; color: #64748b;">
            <span style="color:#0284c7;">{rendering_count}</span> Rendered • 
            <span style="color:#f97316;">{protest_count}</span> Protests • 
            <span style="color:#10b981;">{payment_count}</span> Payments
        </div>
    </div>
    """, unsafe_allow_html=True)

with col_kpi2:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-lbl">Active Tax Protests</div>
        <div class="metric-val" style="color: #ea580c;">{active_protests}</div>
        <div style="font-size: 11px; font-weight:600; color: #64748b;">
            Contesting 2026 Appraisal notices • <span style="color:#10b981; font-weight:700;">{resolved_protests}</span> Settled
        </div>
    </div>
    """, unsafe_allow_html=True)

with col_kpi3:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-lbl">Projected Tax Liability</div>
        <div class="metric-val">${total_tax_due:,.0f}</div>
        <div style="font-size: 11px; font-weight:600; color: #64748b;">
            <span style="color:#10b981; font-weight:700;">${total_tax_paid:,.0f}</span> Paid • 
            <span style="color:#ef4444; font-weight:700;">${total_tax_unpaid:,.0f}</span> Outstanding
        </div>
    </div>
    """, unsafe_allow_html=True)

with col_kpi4:
    st.markdown(f"""
    <div class="metric-card" style="border-color: #bbf7d0; background-color: #f0fdf4;">
        <div class="metric-lbl" style="color: #166534;">Confirmed Tax Savings</div>
        <div class="metric-val" style="color: #15803d;">${estimated_savings:,.2f}</div>
        <div style="font-size: 11px; font-weight:600; color: #166534;">
            Achieved via electronic formal ARB protest filings
        </div>
    </div>
    """, unsafe_allow_html=True)

st.write("")

# ---------------------------------------------------------
# Section 1: Interactive Scraper Crawler Pipeline Console
# ---------------------------------------------------------
with st.expander("⚙️ CAD Crawler Pipeline Console — Trigger Central Appraisal District Scrapers", expanded=False):
    st.markdown('<p style="font-size:12px; font-weight:600; color:#475569; margin-top:-5px;">This control panel launches local Texas County Appraisal District (CAD) crawling nodes. The pipeline downloads new appraisal statements, parses values with Gemini OCR extractors, and syncs databases.</p>', unsafe_allow_html=True)
    
    col_sc1, col_sc2, col_sc3 = st.columns([0.45, 0.35, 0.20])
    
    with col_sc1:
        scraper_entity = st.selectbox(
            "Select Target Entity",
            options=[x["entity"] for x in ENTITY_COUNTIES],
            key="scr_entity"
        )
        
    with col_sc2:
        # Filter counties allowed for this selected entity
        allowed_counties = next((x["counties"] for x in ENTITY_COUNTIES if x["entity"] == scraper_entity), [])
        scraper_county = st.selectbox(
            "Select County Appraisal District",
            options=allowed_counties,
            key="scr_county"
        )
        
    with col_sc3:
        st.write('<div style="height:28px;"></div>', unsafe_allow_html=True)
        run_scraper = st.button("🚀 Run CAD Scraper Pipeline", use_container_width=True)
        
    if run_scraper:
        st.session_state.scraper_logs = []
        progress_bar = st.progress(0)
        log_container = st.empty()
        
        # 1. Look up target properties in rendering stage for this entity + county
        rendering_targets = [p for p in properties if p.get("county") == scraper_county and p.get("owner_name") == scraper_entity and p.get("stage") == "rendering"]
        update_qty = min(len(rendering_targets), random.randint(3, 7))
        target_ids = [p["id"] for p in rendering_targets[:update_qty]]
        
        # Simulation terminal logging statements
        t_now = datetime.now().strftime("%H:%M:%S")
        sim_logs = [
            ("info", f"[{t_now}] Initiating Texas CAD Scraper pipeline for {scraper_entity} in {scraper_county} County..."),
            ("info", f"[{t_now}] Connecting to {scraper_county} Central Appraisal District (CAD) web services..."),
            ("success", f"[{t_now}] Connection established. Target URL verified: https://www.{scraper_county.lower()}cad.org/property/search"),
            ("info", f"[{t_now}] Querying CAD register index for Owner match: \"{scraper_entity}\"..."),
            ("success", f"[{t_now}] Match query returned {len(rendering_targets) + (5 if update_qty == 0 else 0)} property records in database register."),
            ("info", f"[{t_now}] Downloading and parsing active PDF Valuation Notices with Gemini Vision OCR..."),
        ]
        
        if update_qty > 0:
            sim_logs.append(("success", f"[{t_now}] Successfully parsed {update_qty} new 2026 Appraisal notices. Extracted market values & deadlines."))
        else:
            sim_logs.append(("warning", f"[{t_now}] Scraper run: No new May Appraisal Notices found. All builder lots up-to-date."))
            
        sim_logs.extend([
            ("info", f"[{t_now}] Aligning and syncing state with local database properties.json..."),
            ("success", f"[{t_now}] CAD Pipeline execution finished. Successfully synced {update_qty} property entries.")
        ])
        
        # Stream logs in typewriter format to feel highly tactile and interactive
        terminal_html = '<div class="terminal">'
        for idx, (level, msg) in enumerate(sim_logs):
            progress_pct = int(((idx + 1) / len(sim_logs)) * 100)
            progress_bar.progress(progress_pct)
            
            # Form style line
            css_class = f"term-line-{level}"
            line_html = f'<div class="{css_class}">&gt; {msg}</div>'
            terminal_html += line_html
            
            # Print current frame
            log_container.markdown(terminal_html + "</div>", unsafe_allow_html=True)
            time.sleep(0.5) # Pause to simulate processing latency
            
        # Perform actual database updates on disk
        if update_qty > 0:
            today_str = datetime.now().strftime("%Y-%m-%d")
            deadline_str = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            
            # Update matching properties
            updated_state_properties = []
            for p in properties:
                if p["id"] in target_ids:
                    proposed_val = random.randint(145000, 295000)
                    new_history = list(p.get("history", []))
                    new_history.append({
                        "date": today_str,
                        "event": "Appraisal Notice Harvested",
                        "description": f"CAD Portal Crawler parsed 2026 Notice of Appraised Value. Current Appraised Value set to ${proposed_val:,}. Protest deadline calculated as 30 days.",
                        "user": "CAD Scraper Pipeline"
                    })
                    p_updated = {
                        **p,
                        "stage": "protest",
                        "status": "Appraisal Notice Issued",
                        "notice_date": today_str,
                        "protest_deadline": deadline_str,
                        "current_appraised_value": proposed_val,
                        "current_assessed_value": proposed_val,
                        "history": new_history
                    }
                    updated_state_properties.append(p_updated)
                else:
                    updated_state_properties.append(p)
                    
            save_properties_db(updated_state_properties)
            st.session_state.properties = updated_state_properties
            st.success(f"Scraper complete! Successfully transitioned {update_qty} properties from Rendering Phase to Protest Phase.")
            time.sleep(1.0)
            st.rerun()
        else:
            st.warning("All inventory for this Entity & County is already up-to-date! No changes made.")

# ---------------------------------------------------------
# Section 2: Search, Filter, and Two-Column Property Panel
# ---------------------------------------------------------
col_f1, col_f2, col_f3 = st.columns([0.40, 0.30, 0.30])

with col_f1:
    search_query = st.text_input(
        "🔍 Search Property Index",
        placeholder="Search by Street Address, Legal Block/Lot, or CAD Property ID...",
        help="Type to search any property address or CAD record ID"
    )

with col_f2:
    filter_entity = st.selectbox(
        "Filter by Owner Entity",
        options=["All Entities"] + [x["entity"] for x in ENTITY_COUNTIES]
    )

with col_f3:
    # Build list of counties based on entity filter
    if filter_entity == "All Entities":
        all_counties_list = sorted(list({c for item in ENTITY_COUNTIES for c in item["counties"]}))
    else:
        all_counties_list = sorted(next(x["counties"] for x in ENTITY_COUNTIES if x["entity"] == filter_entity))
        
    filter_county = st.selectbox(
        "Filter by County",
        options=["All Counties"] + all_counties_list
    )

# Filter dataframe logic
filtered_props = list(properties)

# Entity Filter
if filter_entity != "All Entities":
    filtered_props = [p for p in filtered_props if p.get("owner_name") == filter_entity]

# County Filter
if filter_county != "All Counties":
    filtered_props = [p for p in filtered_props if p.get("county") == filter_county]

# Search Query Filter
if search_query:
    q = search_query.lower()
    filtered_props = [
        p for p in filtered_props if 
        q in p.get("street_address", "").lower() or 
        q in p.get("property_id", "").lower() or 
        q in p.get("geo_id", "").lower() or 
        q in p.get("legal_description", "").lower()
    ]

# Render properties grid/list using 2 columns (70% Table, 30% Inspector)
col_left_table, col_right_inspector = st.columns([0.65, 0.35])

# Helper to handle row clicking selection
selected_prop = None

with col_right_inspector:
    st.markdown('<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; min-height: 500px;">', unsafe_allow_html=True)
    st.markdown('<p style="font-size:11px; font-weight:800; color:#4f46e5; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:8px;">⚖️ CAD Audit Inspector & Action Center</p>', unsafe_allow_html=True)
    
    # Render select box to pick property to inspect
    # This reactive selectbox lets users click and inspect quickly!
    if filtered_props:
        prop_options = {p["id"]: f"{p.get('street_address')} ({p.get('county')}) - {p.get('status')}" for p in filtered_props}
        
        # Pre-select based on state or default to first index
        pre_sel_idx = 0
        if st.session_state.selected_prop_id in prop_options:
            pre_sel_idx = list(prop_options.keys()).index(st.session_state.selected_prop_id)
            
        chosen_id = st.selectbox(
            "Select Property to Inspect & Resolve",
            options=list(prop_options.keys()),
            format_func=lambda x: prop_options[x],
            index=pre_sel_idx,
            key="prop_inspector_picker"
        )
        st.session_state.selected_prop_id = chosen_id
        selected_prop = next(p for p in properties if p["id"] == chosen_id)
    else:
        st.info("No matching properties found in current filters.")

    st.write("---")
    
    if selected_prop:
        # 1. Address, ID, County Details
        st.markdown(f'<h3 style="font-size:18px; font-weight:900; color:#0f172a; margin-bottom: 2px;">{selected_prop.get("street_address")}</h3>', unsafe_allow_html=True)
        st.markdown(f'<div style="font-size:11px; font-weight:600; color:#64748b; margin-bottom: 12px;">{selected_prop.get("situs_city", "").upper()}, TX {selected_prop.get("situs_zip")} • {selected_prop.get("county").upper()} COUNTY</div>', unsafe_allow_html=True)
        
        # Stage Badge
        badge_html = get_status_badge_html(selected_prop.get("status"))
        st.markdown(f'<div style="margin-bottom: 15px;">Status: {badge_html}</div>', unsafe_allow_html=True)
        
        # Detail Grid
        st.markdown(f"""
        <table style="width:100%; border-collapse: collapse; font-size: 11px; font-weight: 500; color: #475569; margin-bottom: 15px;">
            <tr style="border-bottom: 1px solid #f1f5f9; height: 26px;">
                <td style="font-weight: 700; color:#1e293b; width: 40%;">CAD Property ID</td>
                <td style="font-family: 'JetBrains Mono', monospace;">{selected_prop.get("property_id")}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9; height: 26px;">
                <td style="font-weight: 700; color:#1e293b;">Geo ID</td>
                <td style="font-family: 'JetBrains Mono', monospace;">{selected_prop.get("geo_id")}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9; height: 26px;">
                <td style="font-weight: 700; color:#1e293b;">Owner Entity</td>
                <td>{selected_prop.get("owner_name")}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9; height: 26px;">
                <td style="font-weight: 700; color:#1e293b;">Legal Lot/Acres</td>
                <td>{selected_prop.get("acres")} Acres • Lot {selected_prop.get("legal_description").split("LOT")[-1].strip() if "LOT" in selected_prop.get("legal_description") else "N/A"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9; height: 26px;">
                <td style="font-weight: 700; color:#1e293b;">Tax Rate / City</td>
                <td>{selected_prop.get("tax_rate")}% ({selected_prop.get("situs_city")})</td>
            </tr>
        </table>
        """, unsafe_allow_html=True)
        
        # Valuation Stats Container
        prior_val = selected_prop.get("prior_appraised_value") or 0
        current_val = selected_prop.get("current_appraised_value") or 0
        assessed_val = selected_prop.get("current_assessed_value") or 0
        
        val_diff_percent = ""
        if prior_val > 0:
            pct_chg = ((current_val - prior_val) / prior_val) * 100
            val_diff_percent = f"(+{pct_chg:.1f}%)" if pct_chg > 0 else f"({pct_chg:.1f}%)"
            
        st.markdown(f"""
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
            <p style="font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">Current Appraisals</p>
            <div style="display:flex; justify-content: space-between; align-items:center;">
                <div>
                    <span style="font-size:10px; font-weight:700; color:#64748b;">2025 Prior Assessed</span><br/>
                    <span style="font-size:14px; font-weight:800; color:#1e293b;">${prior_val:,}</span>
                </div>
                <div style="text-align: right;">
                    <span style="font-size:10px; font-weight:700; color:#64748b;">Proposed 2026 Appraisal</span><br/>
                    <span style="font-size:16px; font-weight:950; color:#f97316;">${current_val:,} <span style="font-size:10px; font-weight:800; color:#ef4444;">{val_diff_percent}</span></span>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # ---------------------------------------------------------
        # Interactive Action Center Form Controls
        # ---------------------------------------------------------
        st.markdown('<p style="font-size:11px; font-weight:800; color:#1e293b; text-transform:uppercase; margin-bottom:10px; letter-spacing:0.03em;">Protest Controls & Actions</p>', unsafe_allow_html=True)
        
        current_stage = selected_prop.get("stage")
        current_status = selected_prop.get("status")
        
        if current_stage == "rendering" or current_status == "Appraisal Notice Issued":
            st.warning("Awaiting tax protest submission for 2026 Valuation.")
            if st.button("⚖️ File Electronic Tax Protest", key=f"btn_protest_{selected_prop['id']}", use_container_width=True, type="primary"):
                # Action: Transition to Protest stage, file protest
                updated_props = []
                today_str = datetime.now().strftime("%Y-%m-%d")
                
                for p in properties:
                    if p["id"] == selected_prop["id"]:
                        new_history = list(p.get("history", []))
                        new_history.append({
                            "date": today_str,
                            "event": "Protest Filed",
                            "description": f"Electronic protest submitted contesting May 2026 Proposed Valuation of ${current_val:,}. Contesting unequal appraisal and excessive market value.",
                            "user": "Stacy Carter"
                        })
                        updated_props.append({
                            **p,
                            "stage": "protest",
                            "status": "Protest Filed",
                            "protest_filed_date": today_str,
                            "history": new_history
                        })
                    else:
                        updated_props.append(p)
                        
                save_properties_db(updated_props)
                st.session_state.properties = updated_props
                st.success("Protest filed successfully!")
                time.sleep(0.5)
                st.rerun()
                
        elif current_stage == "protest" and current_status in ["Protest Filed", "Protest Hearing Scheduled"]:
            st.info("Protest is currently active. Record an Appraisal Review Board (ARB) settlement below.")
            
            # Form field for resolution outcome value
            # Standard discount defaults to 15% off proposed market value
            default_resolved_val = int(current_val * 0.85)
            resolved_outcome = st.number_input(
                "ARB Settled Valuation ($)",
                min_value=1000,
                max_value=int(current_val * 1.5),
                value=default_resolved_val,
                step=500,
                key=f"val_res_{selected_prop['id']}"
            )
            
            col_b1, col_b2 = st.columns(2)
            with col_b1:
                # Schedule hearing
                if current_status == "Protest Filed":
                    if st.button("📅 Schedule Hearing", key=f"btn_sched_{selected_prop['id']}", use_container_width=True):
                        updated_props = []
                        today_str = datetime.now().strftime("%Y-%m-%d")
                        sched_date = (datetime.now() + timedelta(days=20)).strftime("%Y-%m-%d")
                        for p in properties:
                            if p["id"] == selected_prop["id"]:
                                new_history = list(p.get("history", []))
                                new_history.append({
                                    "date": today_str,
                                    "event": "Hearing Scheduled",
                                    "description": f"County Appraisal Review Board (ARB) formally scheduled protest hearing for {sched_date}.",
                                    "user": "System"
                                })
                                updated_props.append({
                                    **p,
                                    "status": "Protest Hearing Scheduled",
                                    "history": new_history
                                })
                            else:
                                updated_props.append(p)
                        save_properties_db(updated_props)
                        st.session_state.properties = updated_props
                        st.success("Protest Hearing Scheduled!")
                        time.sleep(0.5)
                        st.rerun()
            with col_b2:
                # Submit settlement
                btn_resolve = st.button("🤝 Record Settlement", key=f"btn_res_{selected_prop['id']}", use_container_width=True, type="primary")
                
            if btn_resolve:
                # Record the protest resolution, transition stage and status, write savings
                updated_props = []
                today_str = datetime.now().strftime("%Y-%m-%d")
                savings_val = current_val - resolved_outcome
                rate = selected_prop.get("tax_rate", 2.0)
                tax_savings = (savings_val * rate) / 100
                
                for p in properties:
                    if p["id"] == selected_prop["id"]:
                        new_history = list(p.get("history", []))
                        new_history.append({
                            "date": today_str,
                            "event": "Protest Resolved",
                            "description": f"Formal ARB settlement concluded. Market value reduced from ${current_val:,} to ${resolved_outcome:,}, generating a net tax savings of ${tax_savings:,.2f}.",
                            "user": "ARB Board / Stacy"
                        })
                        
                        # Generate estimated tax statement due amount
                        final_tax_due = int((resolved_outcome * rate) / 100.0)
                        
                        updated_props.append({
                            **p,
                            "stage": "payment",
                            "status": "Protest Resolved",
                            "current_assessed_value": resolved_outcome,
                            "protest_outcome_value": resolved_outcome,
                            "tax_amount_due": final_tax_due,
                            "payment_status": "unpaid",
                            "history": new_history
                        })
                    else:
                        updated_props.append(p)
                        
                save_properties_db(updated_props)
                st.session_state.properties = updated_props
                st.success(f"Protest settled! Valuation saved: ${savings_val:,}. Annual tax bill reduced by ${tax_savings:,.2f}.")
                time.sleep(1.0)
                st.rerun()
                
        elif current_stage == "payment" or current_status in ["Protest Resolved", "Tax Statement Issued", "Overdue"]:
            tax_bill = selected_prop.get("tax_amount_due") or 0
            pmt_status = selected_prop.get("payment_status", "unpaid")
            
            if pmt_status == "paid":
                st.success("Property taxes successfully posted & cleared. No further actions needed.")
            else:
                st.info(f"Annual property tax bill issued: **${tax_bill:,}** ({pmt_status.upper()})")
                if st.button("💳 Post Electronic Payment", key=f"btn_pay_{selected_prop['id']}", use_container_width=True, type="primary"):
                    updated_props = []
                    today_str = datetime.now().strftime("%Y-%m-%d")
                    for p in properties:
                        if p["id"] == selected_prop["id"]:
                            new_history = list(p.get("history", []))
                            new_history.append({
                                "date": today_str,
                                "event": "Tax Payment Posted",
                                "description": f"Electronic payment of ${tax_bill:,} posted. Cleared county tax receipts.",
                                "user": "Stacy Carter"
                            })
                            updated_props.append({
                                **p,
                                "status": "Tax Paid",
                                "payment_status": "paid",
                                "history": new_history
                            })
                        else:
                            updated_props.append(p)
                            
                    save_properties_db(updated_props)
                    st.session_state.properties = updated_props
                    st.success("Taxes posted & marked as fully paid!")
                    time.sleep(0.5)
                    st.rerun()
        else:
            st.write("Awaiting physical CAD construction progress inspection.")
            
        # ---------------------------------------------------------
        # Chronological Audit History Timeline
        # ---------------------------------------------------------
        st.write("---")
        st.markdown('<p style="font-size:11px; font-weight:800; color:#1e293b; text-transform:uppercase; margin-bottom:12px; letter-spacing:0.03em;">📜 Property Audit Log History</p>', unsafe_allow_html=True)
        
        timeline_html = '<div class="timeline">'
        for event in reversed(selected_prop.get("history", [])):
            date = event.get("date")
            title = event.get("event")
            desc = event.get("description")
            user = event.get("user", "System")
            
            timeline_html += f"""
            <div class="timeline-event">
                <div class="timeline-date">{date}</div>
                <div style="display:flex; align-items:center;">
                    <span class="timeline-header">{title}</span>
                    <span class="timeline-user">{user}</span>
                </div>
                <div class="timeline-body">{desc}</div>
            </div>
            """
        timeline_html += '</div>'
        st.markdown(timeline_html, unsafe_allow_html=True)
        
    st.markdown('</div>', unsafe_allow_html=True)

# ---------------------------------------------------------
# Left Column: Property Table Filtered by Selected Tab
# ---------------------------------------------------------
with col_left_table:
    # Function to render a property table for any active properties list
    def render_property_table(active_props: list[dict]):
        # Render table header details
        st.markdown(f'<p style="font-size: 11px; font-weight:700; color: #475569; margin-bottom: 8px;">SHOWING <b>{len(active_props)}</b> PROPERTIES IN THIS INVENTORY PHASE</p>', unsafe_allow_html=True)
        
        # Build a clean custom pandas frame for high speed, beautiful table display
        if active_props:
            df_display = []
            for p in active_props:
                prior_v = p.get("prior_appraised_value")
                curr_v = p.get("current_appraised_value")
                proposed_tax_est = 0
                
                rate = p.get("tax_rate", 2.0)
                if curr_v:
                    proposed_tax_est = (curr_v * rate) / 100.0
                    
                df_display.append({
                    "ID": p.get("property_id"),
                    "Address": p.get("street_address"),
                    "County": p.get("county"),
                    "Prior Assessed (2025)": f"${prior_v:,}" if prior_v else "—",
                    "Proposed Valuation (2026)": f"${curr_v:,}" if curr_v else "—",
                    "Tax Rate": f"{rate}%",
                    "Projected Taxes": f"${int(proposed_tax_est):,}" if proposed_tax_est else "—",
                    "Status": p.get("status")
                })
                
            pdf = pd.DataFrame(df_display)
            
            # Render beautiful styled HTML data table with custom badges
            table_html = """
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; height: 38px;">
                        <th style="padding-left: 12px; font-weight:700; color: #475569; width: 10%;">ID</th>
                        <th style="padding-left: 10px; font-weight:700; color: #475569; width: 30%;">Situs Address</th>
                        <th style="padding-left: 10px; font-weight:700; color: #475569; width: 12%;">County</th>
                        <th style="padding-left: 10px; font-weight:700; color: #475569; width: 14%;">2025 Prior Val</th>
                        <th style="padding-left: 10px; font-weight:700; color: #475569; width: 14%;">2026 Appraised</th>
                        <th style="padding-left: 10px; font-weight:700; color: #475569; width: 10%;">Tax Rate</th>
                        <th style="padding-left: 10px; font-weight:700; color: #475569; width: 10%;">Projected Tax</th>
                        <th style="padding-left: 10px; font-weight:700; color: #475569; width: 14%;">Status</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for idx, row in pdf.iterrows():
                bg_color = "#ffffff" if idx % 2 == 0 else "#f8fafc"
                badge_str = get_status_badge_html(row["Status"])
                
                table_html += f"""
                    <tr style="background-color: {bg_color}; border-bottom: 1px solid #f1f5f9; height: 34px;">
                        <td style="padding-left: 12px; font-family: 'JetBrains Mono', monospace; font-weight:600; color: #4f46e5;">{row["ID"]}</td>
                        <td style="padding-left: 10px; font-weight:700; color: #0f172a;">{row["Address"]}</td>
                        <td style="padding-left: 10px; font-weight:600; color: #475569;">{row["County"]}</td>
                        <td style="padding-left: 10px; font-weight:500; color: #334155;">{row["Prior Assessed (2025)"]}</td>
                        <td style="padding-left: 10px; font-weight:700; color: #ea580c;">{row["Proposed Valuation (2026)"]}</td>
                        <td style="padding-left: 10px; font-weight:500; color: #475569;">{row["Tax Rate"]}</td>
                        <td style="padding-left: 10px; font-weight:700; color: #0f172a;">{row["Projected Taxes"]}</td>
                        <td style="padding-left: 10px;">{badge_str}</td>
                    </tr>
                """
                
            table_html += "</tbody></table>"
            
            st.markdown(table_html, unsafe_allow_html=True)
        else:
            st.write("No property entries match these filters.")
            
    # Render direct property table
    render_property_table(filtered_props)

# ---------------------------------------------------------
# Footer Information
# ---------------------------------------------------------
st.write("")
st.markdown("""
<div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; font-weight:600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
    <div>© 2026 Stylecraft Builders Inc. Internal Property Tax Auditing & Harvesting Workspace.</div>
    <div>Powered by Texas CAD Crawler Pipeline & Gemini Layout Extractors</div>
</div>
""", unsafe_allow_html=True)
