import axios from "axios";

export const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8000/api/v1"
    : "https://hive-hackathon-project.onrender.com/api/v1");

export const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach bearer token from localStorage
client.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Unwrap envelope { data: ... } or throw standard AppError
export async function unwrap(promise) {
  try {
    const res = await promise;
    if (res.data && typeof res.data === "object" && "data" in res.data) {
      return res.data.data;
    }
    return res.data;
  } catch (err) {
    const data = err.response?.data;
    const msg = data?.error?.message || data?.detail || err.message || "Request failed";
    const code = data?.error?.code || "APP_ERROR";
    const status = err.response?.status;
    const e = new Error(msg);
    e.code = code;
    e.status = status;
    e.details = data?.error?.details;
    throw e;
  }
}

// Download helper for binary files (e.g., PDF reports)
export async function downloadFile(urlPath, filename) {
  const t = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${urlPath}`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  if (!res.ok) throw new Error("Failed to download file");
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const api = {
  get: (url, config) => unwrap(client.get(url, config)),
  post: (url, body, config) => unwrap(client.post(url, body, config)),
  put: (url, body, config) => unwrap(client.put(url, body, config)),
  del: (url, config) => unwrap(client.delete(url, config)),
};

// ---- domain helpers ----
export const AuthAPI = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  updateMe: (payload) => api.put("/auth/me", payload),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, new_password) => api.post("/auth/reset-password", { token, new_password }),
};
export const TripAPI = {
  list: () => api.get("/trips"),
  create: (payload) => api.post("/trips", payload),
  get: (id) => api.get(`/trips/${id}`),
  update: (id, payload) => api.put(`/trips/${id}`, payload),
  remove: (id) => api.del(`/trips/${id}`),
  analyze: (id) => api.post(`/trips/${id}/analyze`),
  risk: (id) => api.get(`/trips/${id}/risk`),
  reportPdf: (id) => downloadFile(`/trips/${id}/report.pdf`, `truckshield-risk-${String(id).slice(0, 8)}.pdf`),
};
export const VehicleAPI = {
  list: () => api.get("/vehicles"),
  create: (payload) => api.post("/vehicles", payload),
  update: (id, payload) => api.put(`/vehicles/${id}`, payload),
  remove: (id) => api.del(`/vehicles/${id}`),
};
export const DocumentAPI = {
  list: () => api.get("/documents"),
  get: (id) => api.get(`/documents/${id}`),
  validate: (id) => api.post(`/documents/${id}/validate`),
  correctFields: (id, fields) => api.put(`/documents/${id}/fields`, { fields }),
  upload: (formData) =>
    api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  download: (id, filename) => downloadFile(`/documents/${id}/download`, filename || `document-${String(id).slice(0, 8)}`),
  downloadUrl: (id) => `${API_BASE}/documents/${id}/download`,
};
export const IncidentAPI = {
  list: () => api.get("/incidents"),
  create: (payload) => api.post("/incidents", payload),
  get: (id) => api.get(`/incidents/${id}`),
};
export const AnalyticsAPI = {
  dashboard: () => api.get("/analytics/dashboard"),
  corridors: () => api.get("/analytics/corridors"),
  corridorDetail: (origin, destination) =>
    api.get(`/analytics/corridors/detail`, { params: { origin, destination } }),
};

export const BillingAPI = {
  plans: () => api.get("/billing/plans"),
  me: () => api.get("/billing/me"),
  subscribe: (tier) => api.post("/billing/subscribe", { tier }),
  verify: (payload) => api.post("/billing/verify", payload),
  cancel: () => api.post("/billing/cancel"),
  listKeys: () => api.get("/billing/api-keys"),
  createKey: (label) => api.post("/billing/api-keys", { label }),
  revokeKey: (id) => api.del(`/billing/api-keys/${id}`),
};

export const ShareAPI = {
  list: (tripId) => api.get(`/trips/${tripId}/shares`),
  create: (tripId, expiry_days) => api.post(`/trips/${tripId}/share`, { expiry_days }),
  revoke: (shareId) => api.del(`/shares/${shareId}`),
  publicReport: (token) => api.get(`/public/report/${token}`),
};

export const DriverSosAPI = {
  getTripInfo: (tripId) => api.get(`/public/trips/${tripId}/driver-info`),
  reportIncident: (tripId, payload) => api.post(`/public/trips/${tripId}/driver-incident`, payload),
};

// Dynamically load the Razorpay Checkout script once.
export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
export const RouteAPI = {
  analyze: (payload) => api.post("/routes/analyze", payload),
};
