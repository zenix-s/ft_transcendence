/* The code provided is setting up base URLs for API and WebSocket connections based on the current
host and protocol. Here's a breakdown of what the code is doing: */

/* 42 WORKING VERSION */
const BACKEND_PORT = 3000;
const isDev = import.meta.env.DEV;
const hostname = window.location.hostname;
const protocol = window.location.protocol;

// --- En DEV: siempre usar el proxy de Vite (rutas relativas)
// Esto evita que el navegador haga peticiones directas a :3000 desde otra máquina.
export const API_BASE_URL = isDev
    ? ''
    : `${protocol}//${hostname}:${BACKEND_PORT}`;
export const WS_BASE_URL = isDev
    ? ''
    : `${protocol === 'https:' ? 'wss' : 'ws'}://${hostname}:${BACKEND_PORT}`;

export function apiUrl(path: string) {
    if (isDev) return `/api${path}`; // <<<<<<<<<<<<<<<<<<< cambio clave
    return `${API_BASE_URL}${path}`;
}

export function getWsUrl(path: string) {
    if (isDev) {
        // Ligar el WS al front dev server; Vite proxy (ws: true) lo reenviará.
        const wsProto = protocol === 'https:' ? 'wss' : 'ws';
        return `${wsProto}://${window.location.host}${path}`;
    }
    return `${WS_BASE_URL}${path}`;
}

//////////////////////////////

/* FIXED CODE */
/* const BACKEND_HOST = "backend"; // Nombre del servicio en docker-compose
const BACKEND_PORT = 3000;

// Detectar si estamos en entorno de desarrollo (vite) o no
const isDev = import.meta.env.DEV;

// Detectar si el frontend está accediéndose desde localhost (fuera de docker)
const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

// Construir URLs base
export const API_BASE_URL = isDev && isLocalhost
  ? "" // Vite usará el proxy: /api -> backend
  : `${window.location.protocol}//${BACKEND_HOST}:${BACKEND_PORT}`;

export const WS_BASE_URL = isDev && isLocalhost
  ? "" // También dejar que el proxy gestione los WS
  : `${window.location.protocol === "https:" ? "wss" : "ws"}://${BACKEND_HOST}:${BACKEND_PORT}`;

// Función para rutas HTTP
export function apiUrl(path: string) {
  if (isDev && isLocalhost) {
    return `/api${path}`; // Vite proxy
  }
  return `${API_BASE_URL}${path}`;
}

// Función para rutas WebSocket
export function getWsUrl(path: string) {
  if (isDev && isLocalhost) {
    return path; // el proxy de Vite se encarga
  }
  return `${WS_BASE_URL}${path}`;
} */

//////////////////////////////

/* EXTENDED CODE */
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

/* DANI */
/* export const API_BASE_URL =
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
    return `${protocol}://${window.location.hostname}:3000${path}`;
    //return `${protocol}://${window.location.host}${path}`;
  }

  // En producción, usar directamente el WS_BASE_URL
  return `${WS_BASE_URL}${path}`;
} */
