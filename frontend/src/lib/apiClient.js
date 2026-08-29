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
  upload: (formData) =>
    api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  downloadUrl: (id) => `${API_BASE}/documents/${id}/download`,
};
export const IncidentAPI = {
  list: () => api.get("/incidents"),
  create: (payload) => api.post("/incidents", payload),
  get: (id) => api.get(`/incidents/${id}`),
};
export const AnalyticsAPI = {
  dashboard: () => api.get("/analytics/dashboard"),
};
export const RouteAPI = {
  analyze: (payload) => api.post("/routes/analyze", payload),
};
