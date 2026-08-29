import React from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function colorForRisk(score) {
  if (score <= 30) return "#16a34a";
  if (score <= 60) return "#d97706";
  if (score <= 80) return "#dc2626";
  return "#991b1b";
}

// radius scales with incident volume
function radiusFor(count) {
  return Math.max(8, Math.min(28, 8 + count * 1.2));
}

export function CorridorMap({ corridors = [], incidentPoints = [] }) {
  const center = [22.5, 79.0];
  return (
    <div className="overflow-hidden rounded-xl border border-border" data-testid="corridor-map">
      <MapContainer center={center} zoom={5} style={{ height: 460, width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {corridors.map((c, i) => {
          const color = colorForRisk(c.risk_score);
          const totalIncidents = (c.incident_count || 0) + (c.user_incident_count || 0);
          return (
            <React.Fragment key={i}>
              <Polyline positions={[c.origin_coord, c.destination_coord]} pathOptions={{ color, weight: 3, opacity: 0.55 }} />
              <CircleMarker
                center={c.midpoint}
                radius={radiusFor(totalIncidents)}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 2 }}
              >
                <Tooltip direction="top" offset={[0, -4]}>
                  <div style={{ fontSize: 12 }}>
                    <strong>{c.corridor_name}</strong><br />
                    Risk score: {c.risk_score}/100<br />
                    Checks/incidents: {c.incident_count}
                    {c.user_incident_count ? ` (+${c.user_incident_count} yours)` : ""}<br />
                    Distance issues: {c.distance_issue_count}
                    {c.is_demo ? <><br /><em>Synthetic demo data</em></> : null}
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}
        {incidentPoints.map((p, i) => (
          <CircleMarker key={`ip-${i}`} center={[p.lat, p.lng]} radius={7}
            pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.6, weight: 2 }}>
            <Tooltip direction="top">
              <div style={{ fontSize: 12 }}>
                <strong>{p.location_name || "Incident"}</strong><br />
                {(p.incident_type || "").replace(/_/g, " ")} · {(p.outcome || "").replace(/_/g, " ")}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
