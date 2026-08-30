"""Plan tiers, limits and entitlements (single source of truth)."""

FREE = "free"
GROWTH = "growth"
PRO = "pro"

# amount in paise (INR) -> 49900 paise = ₹499/mo, 69900 paise = ₹699/mo
PLANS = {
    FREE: {
        "tier": FREE, "name": "Free", "price": 0, "price_label": "\u20b90",
        "checks_per_month": 5, "live_distance": False, "field_correction": True,
        "share_links": 0, "custom_expiry": False, "corridor": "hidden",
        "corridor_drilldown": False, "api_access": False, "support": "Community support",
        "features": [
            "5 pre-dispatch checks / month",
            "Estimated distance only",
            "Field correction",
            "Community support",
        ],
    },
    GROWTH: {
        "tier": GROWTH, "name": "Growth", "price": 49900, "price_label": "\u20b9499",
        "checks_per_month": 100, "live_distance": True, "field_correction": True,
        "share_links": 10, "custom_expiry": False, "corridor": "view",
        "corridor_drilldown": False, "api_access": False, "support": "Email support",
        "features": [
            "100 pre-dispatch checks / month",
            "Live distance provider",
            "Field correction",
            "Report sharing (up to 10 active links)",
            "Corridor heatmap (view-only)",
            "Email support",
        ],
    },
    PRO: {
        "tier": PRO, "name": "Pro", "price": 69900, "price_label": "\u20b9699",
        "checks_per_month": None, "live_distance": True, "field_correction": True,
        "share_links": None, "custom_expiry": True, "corridor": "full",
        "corridor_drilldown": True, "api_access": True, "support": "Priority support",
        "features": [
            "Unlimited pre-dispatch checks",
            "Live distance provider (priority)",
            "Field correction",
            "Unlimited report sharing with custom expiry",
            "Full corridor heatmap drill-down",
            "API access",
            "Priority support",
        ],
    },
}

PAID_TIERS = [GROWTH, PRO]


def plan_config(tier: str) -> dict:
    return PLANS.get(tier or FREE, PLANS[FREE])


def public_plans() -> list:
    return [PLANS[t] for t in (FREE, GROWTH, PRO)]
