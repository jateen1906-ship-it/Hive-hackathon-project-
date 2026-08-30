import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api/v1`;

const TOKEN_KEY = "ts_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error?.response?.data;
    const message =
      data?.error?.message || error?.message || "Network error. Please try again.";
    const code = data?.error?.code || "NETWORK_ERROR";
    if (error?.response?.status === 401 && tokenStore.get()) {
      // token invalid/expired -> clear so guards redirect
      tokenStore.clear();
    }
    return Promise.reject({ message, code, status: error?.response?.status });
  }
);

// Unwrap the {success,data,error} envelope
async function unwrap(promise) {
  const res = await promise;
  return res.data?.data;
}

// Fetch a file (with auth header) as a blob and trigger a browser download.
export async function downloadFile(url, filename) {
  const res = await client.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const api = {
  raw: client,
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
