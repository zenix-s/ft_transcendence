import { getWsUrl } from '@/api';
import { t } from '@/app/i18n';
import { navigateTo } from '@/app/navigation';
import { showToast } from '@/components/toast';
import { refreshTournamentsHistory } from '@/components/tournamentsHistory';
import { createGameSocket } from '../game/gameSocket';
import { modal } from '@/components/modal';

// TODO: Ajustar cuando el backend esté definido
/* interface payload {
    winnerId?: number;
    loserId?: number;
    message: string;
} */

interface AuthSuccessMessage {
    action: 'auth';
    userId: number;
}

interface ErrorMessage {
    action: 'error';
    message: string;
}

interface tournamentStartedMessage {
    action: 'tournamentStarted';
    tournamentId: number;
    tournamentName: string;
    // payload: payload;
}

interface tournamentEndedMessage {
    action: 'tournamentEnded';
    tournamentId: number;
    tournamentName: string;
    // payload: payload;
}

interface tournamentStateUpdatedMessage {
    action: 'tournamentStateUpdated';
    tournamentId: number;
    tournamentName: string;
    // payload: payload;
}

interface newRoundStartedMessage {
    action: 'newRoundStarted';
    tournamentId: number;
    tournamentName: string;
    roundNumber: number;
    // payload: payload;
}

interface matchCreatedMessage {
    action: 'matchCreated';
    tournamentId: number;
    tournamentName: string;
    matchId: number;
    // opponentId: number | null;
    // isAgainstAI: boolean;
    roundNumber: number;
    // payload: payload;
}

interface matchResultMessage {
    action: 'matchResult';
    tournamentId: number;
    tournamentName: string;
    matchId: number;
    roundNumber: number;
    //     payload: payload;
}

interface tournamentWonMessage {
    action: 'tournamentWon';
    tournamentId: number;
    tournamentName: string;
    userId: number;
    // payload: payload;
}

interface tournamentLeaveMessage {
    action: 'tournamenLeave';
    tournamentId: number;
    tournamentName: string;
}

interface Tournament {
    id: number;
    name?: string;
    // otras propiedades del torneo
    [key: string]: unknown;
}

export class TournamentWebSocketClient {
    private socket: WebSocket | null = null;
    private token: string;
    private wsUrl: string;
    private isAuthenticated = false;
    private tournaments: Tournament[] = [];

    constructor(token: string) {
        this.wsUrl = getWsUrl('/tournaments/pong'); // Actualizar al EndPoint correspondiente a los torneos
        this.token = token;
    }

    connect() {
        console.log('🔌 [Tournaments]', t('ConnectingToWs'));
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
            console.log('🟢 [Tournaments]', t('WsConnected'));
            this.authenticate();
        };

        this.socket.onmessage = (event: MessageEvent<string>) => {
            try {
                //console.log("📥 [Tournaments] raw WS message:", event.data); // DB
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (err) {
                console.error(`❌ [Tournaments] ${t('ErrorParsingMsg')}`, err);
            }
        };

        this.socket.onclose = () => {
            console.log('🔴 [Tournaments]', t('WsClosed'));
            this.isAuthenticated = false;
        };

        this.socket.onerror = (err) => {
            console.error(`⚠️ [Tournaments] ${t('WsError')}`, err);
        };
    }

    private authenticate() {
        const msg = { action: 'auth', token: this.token };
        //const msg = { token: this.token };
        this.send(msg);
    }

    private send(obj: unknown) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(obj));
        } else {
            console.warn('⚠️ [Tournaments]', t('WsNotReady'));
        }
    }

    private async handleMessage(message: unknown) {
        // Detectar tipo
        const action = (message as { action?: unknown })?.action;

        switch (action) {
            case 'auth': {
                const msg = message as AuthSuccessMessage;
                this.isAuthenticated = true;
                console.log(
                    `✅ [Tournaments] ${t('SuccessAuthenticated')}`,
                    msg.userId
                );
                break;
            }

            // token inválido, formato incorrecto, acción desconocida, no autenticado, error del servidor
            case 'error': {
                const msg = message as ErrorMessage;
                console.error(
                    `❌ [Tournaments] ${t('ErrorFromServer')}:`,
                    msg.message
                );
                showToast(`${t('ErrorFromServer')}: ${msg.message}`, 'error');
                break;
            }

            // Enviado SÓLO A LOS PARTICIPANTES cuando el torneo comienza
            case 'tournamentStarted': {
                const msg = message as tournamentStartedMessage;
                console.log(
                    `🏆 [Tournaments] ${t('TournamentStarted')}: `,
                    msg.tournamentName
                );
                showToast(
                    `${t('TournamentStarted')}: ${msg.tournamentName}`,
                    'success'
                );
                break;
            }

            // Enviado SÓLO A LOS PARTICIPANTES cuando el torneo termina
            case 'tournamentEnded': {
                const msg = message as tournamentEndedMessage;
                console.log(
                    `🏆 [Tournaments] ${t('TournamentEnded')}: `,
                    msg.tournamentName
                );
                showToast(
                    `${t('TournamentEnded')}: ${msg.tournamentName}`,
                    'success'
                );
                break;
            }

            // Enviado SÓLO A LOS PARTICIPANTES cuando el estado del torneo cambia
            case 'tournamentStateUpdated': {
                const msg = message as tournamentStateUpdatedMessage;
                console.log(
                    `🔄 [Tournaments] ${t('TournamentStateUpdated')}`,
                    msg.tournamentId
                );
                console.log('» Actualizando historia de torneos...'); // DB
                await refreshTournamentsHistory(); // Actualizar la historia de torneos
                break;
            }

            // Enviado SÓLO A LOS PARTICIPANTES cuando comienza una nueva ronda
            case 'newRoundStarted': {
                const msg = message as newRoundStartedMessage;
                console.log(
                    `🔔 [Tournaments] ${t('NewRoundStarted')}`,
                    msg.roundNumber
                );
                showToast(
                    `${t('tournament')} ${msg.tournamentName}. {t('NewRoundStarted')}: ${msg.roundNumber}`,
                    'success'
                );
                break;
            }

            // Enviado SÓLO AL PARTICIPANTE que debe jugar la partida
            case 'matchCreated': {
                const msg = message as matchCreatedMessage;
                console.log(
                    `🎮 [Tournaments] ${t('MatchCreated')}`,
                    msg.matchId
                );

                // Mostrar modal de confirmación
                const confirmed = await modal({
                    type: 'gameInvitation',
                    tournamentModal: true,
                    gameName: 'Tournament Match',
                });

                if (confirmed) {
                    const token = localStorage.getItem('access_token');
                    createGameSocket(token, msg.matchId);

                    navigateTo(`playing?id=${msg.matchId}`);
                } else {
                    console.log(
                        `🚫 [Tournaments] ${t('TournamentInviteDeclined')}`
                    );
                    showToast(t('TournamentInviteDeclined'), 'success');
                    // Manejar rechazo (si es posible en torneos)
                }

                break;
            }

            // Enviado SÓLO A LOS PARTICIPANTES cuando se reporta el resultado de una partida
            /* case 'matchResult': {
                const msg = message as matchResultMessage;
                console.log(
                    `📊 [Tournaments] ${t('MatchResult')}`,
                    msg.matchId
                );
                //showToast(`${t('MatchResult')}: ${msg.matchId}`, 'success');
                break;
            } */

            // Enviado SÓLO AL PARTICIPANTE que gana el torneo
            case 'tournamentWon': {
                const msg = message as tournamentWonMessage;
                console.log(
                    `🏅 [Tournaments] ${t('TournamentWon')}: `,
                    msg.tournamentName
                );
                showToast(
                    `🏆 ${t('TournamentWon')}: ${msg.tournamentName} 🏆`,
                    'success'
                );
                break;
            }

            case 'tournamentLeave': {
                const msg = message as tournamentLeaveMessage;
                console.log(
                    `🏅 [Tournaments] ${t('TournamentLeave')}`,
                    msg.tournamentName
                );
                // Ya se hace desde tournamentHistory.ts
                /* showToast(
                    `${t('TournamentLeave')}: ${msg.tournamentName}`,
                    'success'
                ); */

                console.log('» Actualizando historia de torneos...'); // DB
                await refreshTournamentsHistory();
                break;
            }

            default:
                console.log(`📨 [Tournaments] ${t('MsgReceived')}`, message);
        }
    }

    public getTournaments() {
        return [...this.tournaments];
    }

    public getAuthenticated() {
        return this.isAuthenticated;
    }

    disconnect() {
        if (this.socket) {
            console.log(`👋 [Tournaments] ${t('ClosingWs')}`);
            this.socket.close();
        }
    }
}
