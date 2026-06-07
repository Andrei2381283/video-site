export const SERVER_URL =
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3030"
    : window.location.origin) + "/api";
