import { getWsUrl } from '@/api';
import { t } from '@/app/i18n';
import { navigateTo } from '@/app/navigation';
import { showToast } from '@/components/toast';
import { refreshTournamentsHistory } from '@/components/tournamentsHistory';
import { createGameSocket } from '../game/gameSocket';
import { modal } from '@/components/modal';

const TournamentMessageTypes = {
    AUTH: 'auth',
    TOURNAMENT_STARTED: 'tournamentStarted',
    TOURNAMENT_ENDED: 'tournamentEnded',
    TOURNAMENT_STATE_UPDATED: 'tournamentStateUpdated',
    TOURNAMENT_LEAVE: 'tournamentLeave',
    MATCH_CREATED: 'matchCreated',
    MATCH_RESULT: 'matchResult',
    NEW_ROUND_STARTED: 'newRoundStarted',
    TOURNAMENT_WON: 'tournamentWon',
    ERROR: 'error',
} as const;

interface ErrorMessage {
    action: typeof TournamentMessageTypes.ERROR;
    error: string;
}

interface TournamentStartedMessage {
    action: typeof TournamentMessageTypes.TOURNAMENT_STARTED;
    tournamentId: number;
    tournamentName: string;
}

interface TournamentEndedMessage {
    action: typeof TournamentMessageTypes.TOURNAMENT_ENDED;
    tournamentId: number;
    tournamentName: string;
}

interface NewRoundStartedMessage {
    action: typeof TournamentMessageTypes.NEW_ROUND_STARTED;
    tournamentId: number;
    tournamentName: string;
    roundNumber: number;
}

interface MatchCreatedMessage {
    action: typeof TournamentMessageTypes.MATCH_CREATED;
    tournamentId: number;
    tournamentName: string;
    matchId: number;
    roundNumber: number;
}

interface TournamentWonMessage {
    action: typeof TournamentMessageTypes.TOURNAMENT_WON;
    tournamentId: number;
    tournamentName: string;
    userId: number;
}

interface Tournament {
    id: number;
    name?: string;
    [key: string]: unknown;
}

export class TournamentWebSocketClient {
    private socket: WebSocket | null = null;
    private token: string;
    private wsUrl: string;
    private isAuthenticated = false;
    private tournaments: Tournament[] = [];

    constructor(token: string) {
        this.wsUrl = getWsUrl('/tournaments/pong');
        this.token = token;
    }

    connect() {
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
            this.authenticate();
        };

        this.socket.onmessage = (event: MessageEvent<string>) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch {
                // Error parsing message
            }
        };

        this.socket.onclose = () => {
            this.isAuthenticated = false;
        };

        this.socket.onerror = () => {
            // WebSocket error
        };
    }

    private authenticate() {
        const msg = { action: TournamentMessageTypes.AUTH, token: this.token };
        this.send(msg);
    }

    private send(obj: unknown) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(obj));
        }
    }

    private async handleMessage(message: unknown) {
        const action = (message as { action?: unknown })?.action;

        switch (action) {
            case TournamentMessageTypes.AUTH: {
                this.isAuthenticated = true;
                break;
            }

            case TournamentMessageTypes.ERROR: {
                const msg = message as ErrorMessage;
                const errorMessage = t(msg.error) !== msg.error ? t(msg.error) : msg.error;
                showToast(`${t('ErrorFromServer')}: ${errorMessage}`, 'error');
                break;
            }

            case TournamentMessageTypes.TOURNAMENT_STARTED: {
                const msg = message as TournamentStartedMessage;
                showToast(
                    `${t('TournamentStarted')}: ${msg.tournamentName}`,
                    'success'
                );
                break;
            }

            case TournamentMessageTypes.TOURNAMENT_ENDED: {
                const msg = message as TournamentEndedMessage;
                showToast(
                    `${t('TournamentEnded')}: ${msg.tournamentName}`,
                    'success'
                );
                break;
            }

            case TournamentMessageTypes.TOURNAMENT_STATE_UPDATED: {
                await refreshTournamentsHistory();
                break;
            }

            case TournamentMessageTypes.NEW_ROUND_STARTED: {
                const msg = message as NewRoundStartedMessage;
                showToast(
                    `${t('tournament')} ${msg.tournamentName}. ${t('NewRoundStarted')}: ${msg.roundNumber}`,
                    'success'
                );
                break;
            }

            case TournamentMessageTypes.MATCH_CREATED: {
                const msg = message as MatchCreatedMessage;

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
                    showToast(t('TournamentInviteDeclined'), 'success');
                }
                break;
            }

            case TournamentMessageTypes.TOURNAMENT_WON: {
                const msg = message as TournamentWonMessage;
                showToast(
                    `${t('TournamentWon')}: ${msg.tournamentName}`,
                    'success'
                );
                break;
            }

            case TournamentMessageTypes.TOURNAMENT_LEAVE: {
                await refreshTournamentsHistory();
                break;
            }

            default:
                break;
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
            this.socket.close();
        }
    }
}
