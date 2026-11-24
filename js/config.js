export const API_URL = location.hostname === "127.0.0.1" || location.hostname === "localhost"
  ? "http://localhost:8080"
  : "https://lig4-backend.onrender.com";
export const WS_URL = API_URL.replace(/^http/, "ws");