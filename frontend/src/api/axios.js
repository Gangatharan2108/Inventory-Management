import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // send cookies for session auth
});

// Helper to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Automatically attach CSRF token to unsafe requests
api.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrftoken");

  if (csrfToken) {
    config.headers["X-CSRFToken"] = csrfToken;
  }

  return config;
});

// Get CSRF cookie from backend
export async function getCsrfToken() {
  return api.get("/auth/csrf-cookie/");
}

// Login function
export async function login(username, password) {
  await getCsrfToken();
  return api.post("/auth/login/", { username, password });
}

// Logout function (optional but recommended)
export async function logout() {
  return api.post("/auth/logout/");
}

export default api;