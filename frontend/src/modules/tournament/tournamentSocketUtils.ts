import { TournamentWebSocketClient } from "@/modules/tournament/tournamentSocket";
import { getTournamentSocket } from "./tournamentSocketInstance";

/**
 * The function `getReadyTournamentSocket` returns a promise that resolves with a TournamentlWebSocketClient
 * after ensuring it is authenticated within a specified time interval.
 * @returns A Promise that resolves to a TournamentlWebSocketClient object.
 * 
 * Espera a que el WebSocket Tournament esté autenticado antes de devolverlo.
 */
export async function getReadyTournamentSocket(): Promise<TournamentWebSocketClient | null> {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const ws = getTournamentSocket();
      if (ws) {
        // Si ya está autenticado
        if (ws?.getAuthenticated()) {
          clearInterval(checkInterval);
          resolve(ws);
        }
      }
    }, 100); // 0.1s

    // Timeout por si algo falla
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error("Tournament WebSocket no listo"));
    }, 15000); // 15s
  });
}
