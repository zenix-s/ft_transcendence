import { getSocialSocket } from "./socketInstance";
import type { SocialWebSocketClient } from "./socialSocket";

/**
 * The function `getReadySocialSocket` returns a promise that resolves with a SocialWebSocketClient
 * after ensuring it is authenticated within a specified time interval.
 * @returns A Promise that resolves to a SocialWebSocketClient object.
 */
export async function getReadySocialSocket(): Promise<SocialWebSocketClient | null> {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const ws: SocialWebSocketClient | null = getSocialSocket();
      if (ws) {
        // Si ya está autenticado
        if (ws?.getAuthenticated()) {
          clearInterval(checkInterval);
          resolve(ws);
        }
      }
    }, 50);

    // Timeout por si algo falla
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error("WebSocket no listo"));
    }, 5000);
  });
}
