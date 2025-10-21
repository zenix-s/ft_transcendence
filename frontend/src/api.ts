export const API_BASE_URL =
  `${window.location.protocol}//${window.location.hostname}:3000`;

export const WS_BASE_URL = API_BASE_URL.replace(/^https/, "wss").replace(/^http/, "ws");

export function apiUrl(path: string) {
  // Si estás en desarrollo, usa proxy (Vite se encarga)
  if (import.meta.env.DEV) return `/api${path}`;
  // En producción o entorno real, usa la IP detectada
  return `${API_BASE_URL}${path}`;
}