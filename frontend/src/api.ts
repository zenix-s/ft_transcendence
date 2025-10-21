export const API_BASE_URL =
  `${window.location.protocol}//${window.location.hostname}:3000`;

export const WS_BASE_URL = API_BASE_URL.replace(/^https/, "wss").replace(/^http/, "ws");