import { TournamentWebSocketClient } from '@/modules/tournament/tournamentSocket';

let instance: TournamentWebSocketClient | null = null;

/**
 * Crea (si no existe) y devuelve la instancia del WebSocket Social
 */
export function createTournamentSocket(
    token: string
): TournamentWebSocketClient {
    if (!token)
        throw new Error('❌ No se puede crear WebSocket sin token válido'); // Translation i18n needed
    if (!instance) {
        instance = new TournamentWebSocketClient(token);
        instance.connect();
    }
    return instance;
}

/**
 * Devuelve la instancia actual (o null si aún no existe)
 */
export function getTournamentSocket(): TournamentWebSocketClient | null {
    return instance;
}

/**
 * Desconecta y limpia la instancia actual
 */
export function destroyTournamentSocket() {
    if (instance) {
        instance.disconnect();
        instance = null;
    }
}
