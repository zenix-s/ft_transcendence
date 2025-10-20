import { SocialWebSocketClient } from "./socialSocket";

let instance: SocialWebSocketClient | null = null;

/**
 * Crea (si no existe) y devuelve la instancia del WebSocket Social
 */
export function createSocialSocket(token: string): SocialWebSocketClient {
  if (!token) throw new Error("❌ No se puede crear WebSocket sin token válido");
  if (!instance) {
    instance = new SocialWebSocketClient(token);
    instance.connect();
  }
  return instance;
}

/**
 * Devuelve la instancia actual (o null si aún no existe)
 */
export function getSocialSocket(): SocialWebSocketClient | null {
  return instance;
}

/**
 * Desconecta y limpia la instancia actual
 */
export function destroySocialSocket() {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}
