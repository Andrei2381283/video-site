const DEFAULT_URL = window.location.port
  ? window.location.origin.replace(window.location.port, "3030")
  : window.location.origin + ":3030";
export const SERVER_URL =
  (process.env.NODE_ENV == "development"
    ? "http://localhost:3030"
    : DEFAULT_URL) + "/api";
