/* The code provided is setting up base URLs for API and WebSocket connections based on the current
host and protocol. Here's a breakdown of what the code is doing: */
/* const BACKEND_PORT = 3000;

// Detecta el host actual (IP, dominio o localhost)
const host = window.location.hostname;
const isLocalhost = host === "localhost" || host === "127.0.0.1";

// Detecta protocolo para WS
const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";

// Base URLs
export const API_BASE_URL = `${window.location.protocol}//${host}:${BACKEND_PORT}`;
export const WS_BASE_URL = `${wsProtocol}://${host}:${BACKEND_PORT}`;

export function apiUrl(path: string) {
  // ⚙️ En desarrollo desde localhost → usa proxy de Vite
  if (import.meta.env.DEV && isLocalhost) {
    return `/api${path}`;
  }

  // 🌐 En LAN o producción → usa el host real (IP o dominio)
  return `${API_BASE_URL}${path}`;
}

export function getWsUrl(path: string) {
  // ⚙️ En desarrollo desde localhost → WS por el proxy
  if (import.meta.env.DEV && isLocalhost) {
    const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${wsProto}://${window.location.host}${path}`;
  }

  // 🌐 En LAN o producción → usa el host real (IP o dominio)
  return `${WS_BASE_URL}${path}`;
} */

//////////////////////////////

export const API_BASE_URL =
  `${window.location.protocol}//${window.location.hostname}:3000`;

export const WS_BASE_URL = API_BASE_URL.replace(/^https/, "wss").replace(/^http/, "ws");

export function apiUrl(path: string) {
  // Si estás en desarrollo, usa proxy (Vite se encarga)
  if (import.meta.env.DEV) return `/api${path}`;
  // En producción o entorno real, usa la IP detectada
  console.log("❌ NO entré en el if");
  return `${API_BASE_URL}${path}`;
}

export function getWsUrl(path: string): string {
  if (import.meta.env.DEV) {
    // En desarrollo, el proxy de Vite se encarga
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    //return `${protocol}://${window.location.hostname}:3000${path}`;
    return `${protocol}://${window.location.host}${path}`;
  }

  // En producción, usar directamente el WS_BASE_URL
  return `${WS_BASE_URL}${path}`;
}