import { getSocialSocket } from "./socketInstance";
import type { SocialWebSocketClient } from "./socialSocket";

/**
 * The function `getReadySocialSocket` returns a promise that resolves with a SocialWebSocketClient
 * after ensuring it is authenticated within a specified time interval.
 * @returns A Promise that resolves to a SocialWebSocketClient object.
 */
export async function getReadySocialSocket(): Promise<SocialWebSocketClient> {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const ws = getSocialSocket();
      if (ws) {
        // Si ya está autenticado
        if ((ws as any).isAuthenticated) {
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
