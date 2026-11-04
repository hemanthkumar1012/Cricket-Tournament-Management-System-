const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "cricpulse_token";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("cricpulse:logout"));
}

function formatError(data, status) {
  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join("; ");
  }
  return data?.detail || data?.message || data?.error || `Request failed (${status})`;
}

async function request(path, options = {}, includeAuth = true) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const token = includeAuth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Cannot reach the CricPulse API. Check the backend and network connection.");
  }

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { detail: raw || "The server returned an unreadable response." };
  }

  if (!response.ok) {
    if (response.status === 401 && token) clearSession();
    throw new ApiError(formatError(data, response.status), response.status);
  }
  return data;
}

export const api = {
  login: async (credentials) => {
    const data = await request(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify(credentials) },
      false,
    );
    window.localStorage.setItem(TOKEN_KEY, data.access_token);
    return data;
  },
  me: () => request("/api/auth/me"),
  logout: clearSession,
  health: () => request("/api/health/ready"),
  live: () => request("/api/live"),
  teams: () => request("/api/teams"),
  createTeam: (body) => request("/api/teams", { method: "POST", body: JSON.stringify(body) }),
  standings: () => request("/api/teams/standings"),
  players: () => request("/api/players"),
  createPlayer: (body) => request("/api/players", { method: "POST", body: JSON.stringify(body) }),
  updatePlayer: (id, body) => request(`/api/players/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePlayer: (id) => request(`/api/players/${id}`, { method: "DELETE" }),
  matches: () => request("/api/matches"),
  createMatch: (body) => request("/api/matches", { method: "POST", body: JSON.stringify(body) }),

  scorecard: (id) => request("/api/matches/" + id + "/scorecard"),
  startInnings: (id, body) => request("/api/matches/" + id + "/innings", { method: "POST", body: JSON.stringify(body) }),
  recordDelivery: (id, body) => request("/api/innings/" + id + "/deliveries", { method: "POST", body: JSON.stringify(body) }),
  undoLastDelivery: (id) => request("/api/innings/" + id + "/last-delivery", { method: "DELETE" }),
  finishMatch: (id) => request("/api/matches/" + id + "/finish", { method: "POST" }),
  updateResult: (id, team1Score, team2Score) => {
    const params = new URLSearchParams({
      team1Score: String(team1Score),
      team2Score: String(team2Score),
    });
    return request(`/api/matches/${id}/result?${params.toString()}`, { method: "PUT" });
  },
};
