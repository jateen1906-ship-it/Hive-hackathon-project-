"""Generate a printable PDF of a trip's risk report (reportlab)."""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

from ..envelope import NotFound
from .trips import _get_trip_row, latest_risk

NAVY = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#64748b")
LEVEL_COLORS = {
    "LOW": colors.HexColor("#16a34a"),
    "MEDIUM": colors.HexColor("#d97706"),
    "HIGH": colors.HexColor("#dc2626"),
    "CRITICAL": colors.HexColor("#991b1b"),
}
DISCLAIMER = (
    "TruckShield provides informational compliance pre-checks and risk signals. "
    "Results do not constitute legal advice or guarantee enforcement outcomes."
)
DASH = "\u2014"


async def build_risk_report_pdf(db, user_id: str, trip_id: str) -> bytes:
    row = await _get_trip_row(db, user_id, trip_id)
    if not row:
        raise NotFound("Trip not found")
    data = await latest_risk(db, user_id, trip_id)
    trip = data["trip"]
    ev = data["evaluation"]

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=16 * mm,
                            leftMargin=16 * mm, rightMargin=16 * mm, title="TruckShield Risk Report")
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=NAVY, fontSize=18, spaceAfter=2)
    small = ParagraphStyle("small", parent=styles["Normal"], textColor=MUTED, fontSize=8)
    body = ParagraphStyle("body", parent=styles["Normal"], fontSize=9, leading=13)
    label = ParagraphStyle("label", parent=styles["Normal"], textColor=MUTED, fontSize=8)
    story = []

    story.append(Paragraph("TruckShield \u2014 Pre-departure Risk Report", h1))
    story.append(Paragraph("Informational compliance pre-check", small))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 8))

    route = f"{trip.get('origin')}  \u2192  {trip.get('destination')}"
    meta = [
        ["Route", route, "Travel date", str(trip.get("travel_date") or DASH)],
        ["Vehicle", str(trip.get("vehicle_number") or DASH), "Vehicle type", str(trip.get("vehicle_type") or DASH)],
        ["Declared distance", f"{trip.get('declared_distance_km') or DASH} km", "Estimated (demo)", f"{trip.get('estimated_distance_km') or DASH} km"],
    ]
    t = Table(meta, colWidths=[32 * mm, 55 * mm, 32 * mm, 47 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("TEXTCOLOR", (2, 0), (2, -1), MUTED),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    if not ev:
        story.append(Paragraph("This trip has not been analyzed yet.", body))
    else:
        lvl = (ev.get("level") or "").upper()
        lc = LEVEL_COLORS.get(lvl, MUTED)
        score = ev.get("score")
        score_style = ParagraphStyle("score", parent=styles["Heading1"], textColor=lc, fontSize=26)
        story.append(Paragraph(f"{score}/100 &nbsp; <font size=12>{lvl} RISK</font>", score_style))
        if trip.get("is_demo"):
            story.append(Paragraph("SYNTHETIC / demonstration trip", small))
        story.append(Spacer(1, 8))

        story.append(Paragraph("Why this score?", ParagraphStyle("h2", parent=styles["Heading2"], textColor=NAVY, fontSize=12)))
        rows = [["Factor", "Severity", "Score", "Detail"]]
        for f in ev.get("factors", []):
            rows.append([
                Paragraph(f.get("title", ""), body),
                (f.get("severity") or "").title(),
                str(f.get("score")),
                Paragraph(f.get("description", ""), body),
            ])
        ft = Table(rows, colWidths=[36 * mm, 20 * mm, 14 * mm, 96 * mm], repeatRows=1)
        ft.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(ft)
        story.append(Spacer(1, 10))

        story.append(Paragraph("Recommended actions", ParagraphStyle("h3", parent=styles["Heading2"], textColor=NAVY, fontSize=12)))
        for i, r in enumerate(ev.get("recommendations", []), start=1):
            story.append(Paragraph(f"{i}. {r}", body))
        story.append(Spacer(1, 8))
        story.append(Paragraph(f"Data source: {ev.get('engine_version')} \u00b7 route distance is demonstration data", small))

    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 6))
    story.append(Paragraph(DISCLAIMER, small))
    story.append(Paragraph(f"Generated {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')}", small))

    doc.build(story)
    return buf.getvalue()
