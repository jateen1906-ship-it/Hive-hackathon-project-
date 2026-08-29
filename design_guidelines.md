{
  "brand": {
    "product_name": "TruckShield",
    "positioning": "B2B compliance pre-check + risk signals for Indian road-freight dispatch. Visual language: transport + intelligence + safety. Must feel like a pre-departure inspection report (not a CRUD admin).",
    "required_disclaimer": "TruckShield provides informational compliance pre-checks and risk signals. Results do not constitute legal advice or guarantee enforcement outcomes.",
    "tone_attributes": [
      "professional",
      "trustworthy",
      "operationally fast",
      "explainable",
      "safety-first",
      "India logistics context"
    ]
  },

  "design_personality": {
    "foundation": "Professional navy/white enterprise UI with restrained color usage. Risk colors are the only strong chroma.",
    "layout_principles": [
      "Bento-grid dashboards (dense but breathable)",
      "Inspection-report rhythm (header → summary → findings → actions → evidence)",
      "F-pattern reading (left rail + top summary)",
      "Mobile-first forms (single column, big tap targets)"
    ],
    "signature_motifs": [
      "‘Pre-departure checklist’ cards with pass/warn/fail chips",
      "Risk gauge (semi-circle or ring) with tick marks and labeled thresholds",
      "Document confidence pills (e.g., 92% confident)",
      "Route strip (origin → destination) with distance + date as ‘trip ticket’"
    ]
  },

  "typography": {
    "google_fonts": {
      "ui_font": "Manrope",
      "data_font": "JetBrains Mono",
      "import_note": "Use Google Fonts in index.html or CSS import. Keep body as Manrope; use JetBrains Mono for numbers, vehicle IDs, invoice values, risk score."
    },
    "tailwind_usage": {
      "body": "font-sans text-slate-900",
      "numbers": "font-mono tabular-nums",
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-slate-600",
      "section_title": "text-sm font-semibold tracking-wide text-slate-700",
      "kpi_value": "text-2xl sm:text-3xl font-semibold",
      "table_text": "text-sm",
      "caption": "text-xs text-slate-500"
    },
    "content_rules": [
      "Avoid ALL CAPS for long labels; use Title Case for cards.",
      "Use mono only for values/IDs; never for paragraphs.",
      "Risk score always shown as ‘NN/100’ with mono + tabular nums."
    ]
  },

  "color_system": {
    "notes": [
      "Navy/white foundation. Risk colors ONLY for risk states.",
      "Do not introduce extra accent colors beyond subtle slate neutrals.",
      "No purple anywhere."
    ],
    "tokens_css": {
      "location": "/app/frontend/src/index.css",
      "replace_root_tokens_with": "/* TruckShield tokens (navy/white foundation + risk states) */\n@layer base {\n  :root {\n    --background: 210 40% 98%; /* near-white */\n    --foreground: 222 47% 11%; /* navy ink */\n\n    --card: 0 0% 100%;\n    --card-foreground: 222 47% 11%;\n\n    --popover: 0 0% 100%;\n    --popover-foreground: 222 47% 11%;\n\n    --primary: 222 47% 11%; /* navy */\n    --primary-foreground: 210 40% 98%;\n\n    --secondary: 210 40% 96%;\n    --secondary-foreground: 222 47% 11%;\n\n    --muted: 210 40% 96%;\n    --muted-foreground: 215 16% 47%;\n\n    --accent: 210 40% 96%;\n    --accent-foreground: 222 47% 11%;\n\n    --border: 214 32% 91%;\n    --input: 214 32% 91%;\n    --ring: 222 47% 11%;\n\n    /* Risk state colors (ONLY strong chroma) */\n    --risk-low: 142 71% 45%;      /* green */\n    --risk-medium: 45 93% 47%;    /* amber/yellow */\n    --risk-high: 0 84% 60%;       /* red */\n    --risk-critical: 0 74% 42%;   /* dark red */\n\n    /* Surfaces for risk callouts (tints) */\n    --risk-low-bg: 142 71% 96%;\n    --risk-medium-bg: 45 93% 95%;\n    --risk-high-bg: 0 84% 96%;\n    --risk-critical-bg: 0 74% 95%;\n\n    --radius: 0.75rem;\n  }\n\n  .dark {\n    /* Optional: keep dark mode minimal; do not rely on it as default */\n    --background: 222 47% 7%;\n    --foreground: 210 40% 98%;\n    --card: 222 47% 9%;\n    --card-foreground: 210 40% 98%;\n    --popover: 222 47% 9%;\n    --popover-foreground: 210 40% 98%;\n    --primary: 210 40% 98%;\n    --primary-foreground: 222 47% 11%;\n    --secondary: 222 47% 12%;\n    --secondary-foreground: 210 40% 98%;\n    --muted: 222 47% 12%;\n    --muted-foreground: 215 20% 70%;\n    --accent: 222 47% 12%;\n    --accent-foreground: 210 40% 98%;\n    --border: 222 47% 16%;\n    --input: 222 47% 16%;\n    --ring: 210 40% 85%;\n  }\n}\n"
    },
    "risk_mapping": {
      "LOW": { "label": "Low", "color_hsl": "var(--risk-low)", "bg_hsl": "var(--risk-low-bg)" },
      "MEDIUM": { "label": "Medium", "color_hsl": "var(--risk-medium)", "bg_hsl": "var(--risk-medium-bg)" },
      "HIGH": { "label": "High", "color_hsl": "var(--risk-high)", "bg_hsl": "var(--risk-high-bg)" },
      "CRITICAL": { "label": "Critical", "color_hsl": "var(--risk-critical)", "bg_hsl": "var(--risk-critical-bg)" }
    },
    "neutrals": {
      "ink": "slate-900",
      "subtext": "slate-600",
      "borders": "slate-200",
      "page_bg": "slate-50"
    },
    "gradients_and_texture": {
      "allowed_usage": "Hero/landing section background only (<=20% viewport).",
      "recommended_gradient": "background: radial-gradient(1200px circle at 20% 10%, rgba(15,23,42,0.10), transparent 55%), radial-gradient(900px circle at 80% 0%, rgba(2,132,199,0.08), transparent 50%);",
      "noise_overlay": "Use a subtle CSS noise overlay (opacity 0.04–0.06) on landing hero only. Never on reading-heavy report sections."
    }
  },

  "spacing_and_grid": {
    "container": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    "app_shell_grid": {
      "desktop": "Sidebar 280px fixed + content fluid; top header 56px.",
      "tablet": "Sidebar collapsible (Sheet/Drawer).",
      "mobile": "Bottom-safe padding; sidebar becomes Sheet; primary actions sticky."
    },
    "spacing_scale_usage": [
      "Use 6/8/10/12 spacing for section separation.",
      "Cards: p-4 (mobile) → p-6 (desktop).",
      "Forms: gap-3 (mobile) → gap-4 (desktop)."
    ]
  },

  "component_path": {
    "shadcn_primary": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/card.jsx",
      "/app/frontend/src/components/ui/badge.jsx",
      "/app/frontend/src/components/ui/table.jsx",
      "/app/frontend/src/components/ui/input.jsx",
      "/app/frontend/src/components/ui/textarea.jsx",
      "/app/frontend/src/components/ui/select.jsx",
      "/app/frontend/src/components/ui/calendar.jsx",
      "/app/frontend/src/components/ui/dialog.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/tabs.jsx",
      "/app/frontend/src/components/ui/progress.jsx",
      "/app/frontend/src/components/ui/skeleton.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/tooltip.jsx",
      "/app/frontend/src/components/ui/sonner.jsx"
    ],
    "charts": "recharts (already available)",
    "motion": "framer-motion (already available)",
    "icons": "lucide-react (already available)"
  },

  "core_layouts": {
    "public_landing": {
      "hero": {
        "layout": "Split hero: left copy + right ‘risk gauge’ illustration card. Keep gradient only behind hero.",
        "cta": "Primary: ‘Analyze a Trip’ (routes to /register or /login). Secondary: ‘See sample report’ (opens Dialog with SYNTHETIC report).",
        "trust_row": "3–5 trust chips: ‘Explainable factors’, ‘OCR pre-check’, ‘Dispatch-ready checklist’, ‘Built for Indian freight’."
      },
      "sections": [
        "How it works (3 steps)",
        "What we check (factor categories)",
        "Sample inspection report preview (SYNTHETIC)",
        "Security & disclaimer block",
        "Footer with disclaimer repeated"
      ]
    },
    "auth_pages": {
      "layout": "Two-column on desktop (left brand panel, right form). Single column on mobile.",
      "form": "Card with clear labels, password rules, and inline errors."
    },
    "app_shell": {
      "header": "Top bar with search (optional), org switch (optional), user menu, and ‘New Trip’ CTA.",
      "sidebar": {
        "style": "Navy-tinted sidebar surface (not full dark). Use icons + labels.",
        "nav_items": [
          "Dashboard",
          "Trips",
          "Documents",
          "Incidents",
          "Analytics",
          "Settings"
        ],
        "mobile": "Use Sheet component; open via hamburger button with data-testid=\"app-shell-open-nav\"."
      }
    }
  },

  "dashboard": {
    "goal": "Answer: ‘What should this fleet worry about today?’ in <10 seconds.",
    "top_kpis": {
      "layout": "Responsive bento: 2 cols mobile, 3 cols tablet, 5 cols desktop.",
      "cards": [
        "Active Trips",
        "High Risk",
        "Medium Risk",
        "Low Risk",
        "Incidents"
      ],
      "kpi_card_style": "Card with small label + big number (mono) + tiny delta/trend sparkline optional. Risk KPIs use subtle tinted left border only (border-l-4) to avoid over-coloring."
    },
    "recent_trips": {
      "component": "Table with sticky header on desktop; on mobile switch to stacked cards.",
      "columns": ["Trip", "Route", "Date", "Risk", "Docs"],
      "risk_badge": "Use Badge with risk color mapping; include score chip ‘78/100’."
    },
    "alerts_panel": {
      "layout": "Right column on desktop; collapses below on mobile.",
      "items": [
        "Route alerts (e.g., distance mismatch)",
        "Document warnings (missing/low confidence)",
        "Upcoming travel date reminders"
      ],
      "empty_state": "Show calm empty state: ‘No alerts right now’ + subtle icon."
    },
    "risk_trend": {
      "chart": "Recharts AreaChart or BarChart with neutral navy line; use risk colors only for legend chips, not the whole chart fill.",
      "time_ranges": "Tabs: 7d / 30d / 90d"
    }
  },

  "trip_create_form": {
    "principles": [
      "Fast, minimal typing",
      "Progressive disclosure",
      "Inline validation + helper text",
      "Sticky Analyze CTA"
    ],
    "layout": {
      "desktop": "Two-column form grid with Card sections: Route, Vehicle, Goods, Documents.",
      "mobile": "Single column; sections become Collapsible blocks; Analyze button sticky at bottom."
    },
    "fields": {
      "route": ["origin", "destination", "travel_date", "declared_distance"],
      "vehicle": ["vehicle_select_or_new", "vehicle_number", "vehicle_type"],
      "goods": ["goods_description", "invoice_value"],
      "documents_optional": ["invoice_upload", "eway_bill_upload"]
    },
    "components": {
      "date": "Use shadcn Calendar inside Popover.",
      "select": "Use shadcn Select for vehicle type.",
      "upload": "Use Input type=file + Card dropzone styling; show file chips with remove action."
    },
    "cta": {
      "primary_button": "Button variant=default, label ‘Analyze Trip’. Add data-testid=\"trip-analyze-button\".",
      "loading": "On submit: disable button, show spinner + ‘Analyzing…’ and Skeleton for result preview."
    }
  },

  "risk_report": {
    "visual_structure": "Looks like an inspection report: Header ticket → Risk summary → Findings → Recommended actions → Evidence & sources → Disclaimer.",
    "header_ticket": {
      "layout": "Card with route strip (Origin → Destination), travel date, vehicle number, goods summary.",
      "microcopy": "Label any demo data as ‘SYNTHETIC’ badge near the title."
    },
    "risk_gauge": {
      "design": "Semi-circle gauge with tick marks at 0/25/50/75/100 and colored arc segments (green/amber/red/dark red). Keep the arc thin; center shows score + risk label.",
      "implementation_hint": {
        "option_a": "Use SVG arc + stroke-dasharray; animate needle/arc with framer-motion.",
        "option_b": "Use Recharts RadialBarChart with custom startAngle/endAngle and segment coloring."
      },
      "accessibility": "Always include text label: ‘Risk: High (78/100)’; do not rely on color alone."
    },
    "factor_breakdown": {
      "layout": "Grid of factor cards (1 col mobile, 2 col desktop).",
      "factor_card": {
        "parts": ["title", "why_it_matters", "signal", "severity_badge", "recommendation"],
        "style": "Left border tinted by severity; body stays white."
      }
    },
    "recommended_actions": {
      "component": "Ordered list inside Card; each action has checkbox-like affordance (non-interactive unless product requires).",
      "cta": "Primary action: ‘Export report’ (if exists) or ‘Mark as reviewed’."
    },
    "data_sources_and_disclaimer": {
      "component": "Alert component with neutral style; disclaimer text always visible at bottom of report and in print/export.",
      "required": true
    }
  },

  "documents_ocr_precheck": {
    "list_page": {
      "table": "Documents table with type, trip link, status, extracted fields count, last updated.",
      "upload_cta": "Button ‘Upload Document’ opens Dialog with dropzone. data-testid=\"documents-upload-button\"."
    },
    "detail_page": {
      "layout": "Two-column: left document preview (image/pdf placeholder), right extracted fields + validations.",
      "extracted_fields": {
        "component": "Table or definition list; each row shows field name, extracted value, confidence pill.",
        "confidence_pill": "Badge variant=secondary + mono percent; color stays neutral (do not use risk colors for confidence)."
      },
      "validation_results": {
        "component": "Factor-like cards: ‘Potential issue’, ‘Why flagged’, ‘Suggested review wording’.",
        "tone": "Always ‘potential inconsistency’ language; never legal determinations."
      }
    }
  },

  "incidents_mobile_first": {
    "goal": "Extremely fast incident reporting for drivers on mobile.",
    "layout": "Single Card, single column, large inputs, minimal optional fields. Sticky submit button.",
    "fields": [
      "location (free text + optional GPS later)",
      "incident type (Select)",
      "reason (Select)",
      "documents requested (Checkbox group)",
      "outcome (Select)",
      "notes (Textarea)"
    ],
    "ux_rules": [
      "Default to the most common options.",
      "Use big tap targets (min-h-11).",
      "Show success toast + confirmation screen with incident ID (mono)."
    ]
  },

  "analytics": {
    "charts": {
      "risk_distribution": "Donut/Pie with segments colored by risk states (allowed). Keep labels outside with leader lines.",
      "incident_trend": "Line chart in navy; use risk colors only for markers when filtering by severity.",
      "empty_state": "If no data: show Skeleton chart frame + message ‘No trips in selected range’."
    },
    "filters": "Use Tabs for time range + Select for fleet/vehicle type."
  },

  "states_patterns": {
    "loading": {
      "components": ["Skeleton", "Progress"],
      "rules": [
        "Use skeletons that match final layout (avoid spinners-only).",
        "For Analyze Trip: show progress steps: ‘Validating inputs → Checking documents → Computing risk signals’."
      ]
    },
    "empty": {
      "rules": [
        "Explain what to do next (CTA).",
        "Use neutral illustration/icon; no gradients."
      ]
    },
    "error": {
      "rules": [
        "Use Alert component with clear title + next step.",
        "Include retry button with data-testid=\"error-retry-button\".",
        "Never expose raw stack traces; show request id if available."
      ]
    },
    "success": {
      "toasts": "Use sonner for success confirmations (e.g., trip created, document uploaded).",
      "confirmation": "For critical flows (incident submit), show a dedicated success screen too."
    },
    "synthetic_data_labeling": {
      "rule": "Any demo data must show a persistent ‘SYNTHETIC’ Badge near page title and in tables.",
      "badge": "Badge variant=outline with text ‘SYNTHETIC’. data-testid=\"synthetic-data-badge\"."
    }
  },

  "micro_interactions_motion": {
    "principles": [
      "Subtle, purposeful motion",
      "No universal transition",
      "Prefer opacity/translate for entrances"
    ],
    "patterns": {
      "card_hover": "On hover: shadow-sm → shadow-md, translate-y-[-1px] (desktop only).",
      "button_press": "active: scale-[0.98] with transition-transform duration-150",
      "page_enter": "framer-motion: initial {opacity:0, y:6} animate {opacity:1, y:0} duration 0.25",
      "gauge_animate": "Animate needle/arc from previous score to new score over 600–900ms with easeOut"
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text and interactive elements.",
      "Risk meaning must not rely on color alone (always include label + score).",
      "Visible focus rings using --ring.",
      "Keyboard navigable sidebar + dialogs."
    ],
    "aria": [
      "Gauge should have aria-label like ‘Trip risk score 78 out of 100, High risk’.",
      "Tables need proper headers; mobile cards should preserve labels."
    ]
  },

  "testing_attributes": {
    "rule": "All interactive and key informational elements MUST include data-testid (kebab-case).",
    "examples": [
      "data-testid=\"login-form-submit-button\"",
      "data-testid=\"dashboard-kpi-high-risk\"",
      "data-testid=\"trip-form-origin-input\"",
      "data-testid=\"risk-report-score\"",
      "data-testid=\"document-ocr-confidence-pill\"",
      "data-testid=\"incident-submit-button\""
    ]
  },

  "image_urls": [
    {
      "category": "landing_hero_background",
      "description": "Use as subtle hero background image (apply dark navy overlay 10–18% opacity).",
      "url": "https://images.unsplash.com/photo-1598105397032-3d0e18709c05?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHw0fHxpbmRpYW4lMjBoaWdod2F5JTIwZnJlaWdodCUyMHRydWNrJTIwYWVyaWFsfGVufDB8fHxibHVlfDE3ODgwNDA1Mzh8MA&ixlib=rb-4.1.0&q=85"
    },
    {
      "category": "landing_secondary_section",
      "description": "Use for ‘Operations-ready’ section; crop wide; keep neutral treatment.",
      "url": "https://images.unsplash.com/photo-1585652516863-fbc02c1c206e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBoaWdod2F5JTIwZnJlaWdodCUyMHRydWNrJTIwYWVyaWFsfGVufDB8fHxibHVlfDE3ODgwNDA1Mzh8MA&ixlib=rb-4.1.0&q=85"
    },
    {
      "category": "landing_footer_or_about",
      "description": "Use as subtle texture image behind footer (very low opacity) or not at all if it hurts readability.",
      "url": "https://images.unsplash.com/photo-1655301095849-42e5725648e3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwxfHx0cnVjayUyMGZsZWV0JTIwbG9naXN0aWNzJTIweWFyZCUyMGluZGlhfGVufDB8fHxibHVlfDE3ODgwNDA1NDN8MA&ixlib=rb-4.1.0&q=85"
    }
  ],

  "instructions_to_main_agent": {
    "css_cleanup": [
      "Remove CRA demo styles from /app/frontend/src/App.css (App-header centering etc.).",
      "Implement the token replacement in index.css :root and keep Tailwind base layers intact.",
      "Do NOT add .App { text-align:center } anywhere."
    ],
    "component_build_notes_js": [
      "This repo uses .jsx (not .tsx). Keep components in .jsx and use prop-types only if already used; otherwise rely on runtime checks + clear naming.",
      "Use shadcn/ui components from /src/components/ui; do not use raw HTML dropdowns/calendars/toasts.",
      "Use sonner for toasts (already in ui/sonner.jsx)."
    ],
    "risk_badges": [
      "Create a small utility: getRiskMeta(score) => {label, toneClass, bgClass} mapping thresholds (e.g., 0-24 low, 25-49 medium, 50-74 high, 75-100 critical) OR use backend-provided level if available.",
      "Ensure risk colors are used only for badges, left borders, and gauge arcs—not for whole card backgrounds except subtle tints."
    ],
    "disclaimer_placement": [
      "Always show disclaimer in risk report and documents validation views.",
      "Also show disclaimer in landing footer and in-app Settings/About."
    ],
    "synthetic_labeling": [
      "If demo mode exists, add a persistent SYNTHETIC badge in header + on any sample report modal."
    ],
    "data_testids": [
      "Add data-testid to: sidebar nav links, primary CTAs, form inputs, submit buttons, risk score display, factor cards, upload controls, and error retry buttons."
    ]
  }
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
