import { getWsUrl } from '@/api';
import { t } from '@/app/i18n';
import { navigateTo } from '@/app/navigation';
import {
    acceptInvitation,
    rejectInvitation,
} from '@/components/friendsSidebar/friendsSidebar';
import { modal, activeGameModal } from '@/components/modal';
import { showToast } from '@/components/toast';
import type { Friend } from '@/types/friend';
import { reloadGameHistory } from '@/app/main';
import { createGameSocket, getGameSocket } from '../game/gameSocket';

const SocialActions = {
    AUTH: 0,
    LIST_FRIENDS: 1,
    CHECK_ACTIVE_GAME: 2,
} as const;

const SocialMessageTypes = {
    AUTH_SUCCESS: 'authSuccess',
    FRIENDS_LIST: 'friendsList',
    GAME_INVITATION: 'gameInvitation',
    GAME_INVITATION_ACCEPTANCE: 'gameInvitationAcceptance',
    GAME_INVITATION_REJECTION: 'gameInvitationRejection',
    FRIEND_PROFILE_UPDATE: 'friendProfileUpdate',
    FRIEND_CONNECTION_STATUS: 'friendConnectionStatus',
    CHECK_ACTIVE_GAME: 'checkActiveGame',
    ERROR: 'error',
} as const;

interface ActiveGameState {
    hasActiveGame: boolean;
    gameId?: number;
    opponentUsername?: string | null;
}

interface AuthSuccessMessage {
    type: 'authSuccess';
    userId: number;
}

interface FriendsListMessage {
    type: 'friendsList';
    friends: Friend[];
}

interface FriendConnectionStatusMessage {
    type: 'friendConnectionStatus';
    friendId: number;
    username: string;
    isConnected: boolean;
}

interface GameInvitationResponse {
    type: 'gameInvitation';
    success: boolean;
    message: string;
    fromUserId: number;
    fromUsername: string;
    fromUserAvatar: string | null;
    gameId: number;
    gameTypeName: string;
    matchSettings: MatchSettings;
}

interface MatchSettings {
    maxGameTime: number;
    maxScore: number;
    visualStyle: string;
}

interface gameInvitationAcceptance {
    type: 'gameInvitationAcceptance';
    success: boolean;
    fromUserId: number;
    fromUsername: string;
    fromUserAvatar: string | null;
    gameId: number;
    gameTypeName: string;
    message: string;
}

interface CheckActiveGameResponse {
    type: 'checkActiveGame';
    hasActiveGame: boolean;
    gameId?: number;
    status?: string;
    opponent?: {
        id: number;
        username: string | null;
        avatar: string | null;
    };
}

interface ErrorMessage {
    type: 'error';
    error: string;
}

export class SocialWebSocketClient {
    private socket: WebSocket | null = null;
    private token: string;
    private wsUrl: string;
    private isAuthenticated = false;
    private friends: Friend[] = [];

    constructor(token: string) {
        this.wsUrl = getWsUrl('/social/');
        this.token = token;
    }

    connect() {
        // console.log('🔌', t('ConnectingToWs')); // DB
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
            // console.log('🟢', t('WsConnected')); // DB
            this.authenticate();
        };

        this.socket.onmessage = (event: MessageEvent<string>) => {
            try {
                const message = JSON.parse(event.data);
                // console.log('msgttt=', message); // DB
                this.handleMessage(message);
            } catch (err) {
                console.error(`❌ ${t('ErrorParsingMsg')}`, err);
            }
        };

        this.socket.onclose = () => {
            // console.log('🔴', t('WsClosed')); // DB
            this.isAuthenticated = false;
        };

        this.socket.onerror = (err) => {
            console.error(`⚠️ ${t('WsError')}`, err);
        };
    }

    private authenticate() {
        const msg = { action: SocialActions.AUTH, token: this.token };
        this.send(msg);
    }

    public requestFriendsList() {
        if (!this.isAuthenticated) {
            console.error('❌', t('NotAuthenticated'));
            return;
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('⚠️', t('WsNotOpen'));
            return;
        }

        const msg = { action: SocialActions.LIST_FRIENDS };
        // console.log('📋', t('RequestFriends')); // DB
        this.send(msg);
    }

    public refreshFriendsList() {
        this.requestFriendsList();
    }

    public requestCheckActiveGame() {
        if (!this.isAuthenticated) {
            return;
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const msg = { action: SocialActions.CHECK_ACTIVE_GAME };
        this.send(msg);
    }

    private send(obj: unknown) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(obj));
        } else {
            console.warn('⚠️', t('WsNotReady'));
        }
    }

    private disconnectTimers: Map<number, NodeJS.Timeout> = new Map();

    private activeGame: ActiveGameState = {
        hasActiveGame: false,
    };

    private async handleMessage(message: unknown) {
        // Detectar tipo
        const type = (message as { type?: unknown })?.type;

        switch (type) {
            case SocialMessageTypes.ERROR: {
                const msg = message as ErrorMessage;
                const errorMessage =
                    t(msg.error) !== msg.error ? t(msg.error) : msg.error;

                // TODO: mejorar esto hace conflicto con otros sockets,
                // deberia de hacerse a traves del /me
                // if (msg.error === 'invalidToken') {
                //     performLogout();
                //     break;
                // }

                showToast(`${t('ErrorFromServer')}: ${errorMessage}`, 'error');
                break;
            }

            case SocialMessageTypes.AUTH_SUCCESS: {
                // const msg = message as AuthSuccessMessage;
                this.isAuthenticated = true;
                // console.log(`✅ ${t('SuccessAuthenticated')}`, msg.userId); // DB
                // Mejor sólo devolver lista cuando la página lo solicite????
                setTimeout(() => this.requestFriendsList(), 100);
                // Check for active game after authentication
                setTimeout(() => this.requestCheckActiveGame(), 200);
                break;
            }

            case SocialMessageTypes.FRIENDS_LIST: {
                const msg = message as FriendsListMessage;
                this.friends = msg.friends;
                // console.log(`👥 ${t('FriendListReceived')}`, this.friends); // DB
                if (this.onFriendsUpdateCallback)
                    this.onFriendsUpdateCallback([...this.friends]);
                break;
            }

            case SocialMessageTypes.GAME_INVITATION: {
                const msg = message as GameInvitationResponse;
                /* console.log(
                    `${msg.fromUsername} con id ${msg.fromUserId} te ha invitado a jugar a PONG con el número de partida ${msg.gameId} y el mensaje: ${msg.message}`
                ); */ // DB

                // Skip if already on /playing page
                const urlObjeto = new URL(window.location.href);
                if (urlObjeto.pathname === '/playing') {
                    // console.log('se ha rechazado la invitación'); // DB
                    await rejectInvitation(msg.gameId);
                    break;
                }
                const confirmed = await modal({
                    type: 'gameInvitation',
                    winner: msg.fromUsername,
                    gameName: msg.gameTypeName,
                });
                if (confirmed) {
                    // Definir que pasa si se ACEPTA la invitación
                    // console.log('Has aceptado la invitación'); // DB

                    const response = await acceptInvitation(msg.gameId);

                    const token = localStorage.getItem('access_token');
                    createGameSocket(token, msg.gameId);

                    /* console.log(
                        'msg=',
                        msg,
                        'visual style =',
                        msg.matchSettings.visualStyle
                    ); */ // DB
                    if (response) navigateTo(`playing?id=${msg.gameId}`); // Enviar a la partida
                } else {
                    // console.log('he rechazado la invitación'); // DB
                    await rejectInvitation(msg.gameId);
                    // Definir que pasa si RECHAZA la invitación
                }
                break;
            }

            case SocialMessageTypes.GAME_INVITATION_ACCEPTANCE: {
                const msg = message as gameInvitationAcceptance;
                navigateTo(`playing?id=${msg.gameId}`); // Temporal para pruebas?
                showToast(
                    'Aceptada la invitación por: ' + msg.fromUsername,
                    'success'
                );
                break;
            }

            case SocialMessageTypes.GAME_INVITATION_REJECTION: {
                const ws = getGameSocket();
                if (ws) ws.invitationRejected();
                break;
            }

            case SocialMessageTypes.FRIEND_PROFILE_UPDATE: {
                // console.log('Friend profile update detected'); // DB
                this.requestFriendsList();

                // Reload History
                reloadGameHistory(this.token);

                break;
            }

            case SocialMessageTypes.FRIEND_CONNECTION_STATUS: {
                const msg = message as FriendConnectionStatusMessage;
                const friend = this.friends.find((f) => f.id === msg.friendId);

                if (!friend) return;

                const timeDelay: number = 3000; // 3 seconds

                // ⚡ DESCONEXIÓN
                if (!msg.isConnected) {
                    // Cancelamos cualquier timer previo
                    const prevTimer = this.disconnectTimers.get(msg.friendId);
                    if (prevTimer) clearTimeout(prevTimer);

                    // Programamos desconexión real en 3s
                    const timer = setTimeout(() => {
                        friend.is_connected = false;
                        /* console.log(
                            `🔄 ${msg.username} ${t('IsNow')} 🔴 ${t('Offline')}`
                        ); */ // DB
                        showToast(
                            `🔄 ${msg.username} ${t('IsNow')} 🔴 ${t('Offline')}`,
                            'success'
                        );
                        if (this.onFriendsUpdateCallback) {
                            this.onFriendsUpdateCallback([...this.friends]);
                        }
                        this.disconnectTimers.delete(msg.friendId);
                    }, timeDelay);

                    this.disconnectTimers.set(msg.friendId, timer);
                    return; // ignoramos el toast inmediato
                }

                // ⚡ CONEXIÓN
                if (msg.isConnected) {
                    // Si había un timer de desconexión pendiente → cancelamos
                    const timer = this.disconnectTimers.get(msg.friendId);
                    if (timer) {
                        clearTimeout(timer);
                        this.disconnectTimers.delete(msg.friendId);
                        // Es recarga → no mostramos nada
                    } else {
                        // Conexión real → mostramos toast inmediatamente
                        friend.is_connected = true;
                        /* console.log(
                            `🔄 ${msg.username} ${t('IsNow')} 🟢 ${t('Online')}`
                        ); */ // DB
                        showToast(
                            `🔄 ${msg.username} ${t('IsNow')} 🟢 ${t('Online')}`,
                            'success'
                        );
                        if (this.onFriendsUpdateCallback) {
                            this.onFriendsUpdateCallback([...this.friends]);
                        }
                    }
                }

                break;
            }

            case SocialMessageTypes.CHECK_ACTIVE_GAME: {
                const msg = message as CheckActiveGameResponse;

                // Guardar estado
                this.activeGame = {
                    hasActiveGame: msg.hasActiveGame,
                    gameId: msg.gameId,
                    opponentUsername: msg.opponent?.username ?? null,
                };

                // Notificar a la UI
                if (this.onActiveGameUpdateCallback) {
                    this.onActiveGameUpdateCallback({ ...this.activeGame });
                }

                if (!msg.hasActiveGame) {
                    break;
                }

                /* // Skip if already on /playing page
                const urlObjeto = new URL(window.location.href);
                if (urlObjeto.pathname === '/playing') {
                    break;
                }

                const confirmed = await activeGameModal({
                    opponentUsername: msg.opponent?.username ?? undefined,
                });

                if (confirmed === true) {
                    // Resume game
                    const token = localStorage.getItem('access_token');
                    createGameSocket(token, msg.gameId!);
                    navigateTo(`playing?id=${msg.gameId}`);
                } else if (confirmed === 'leave') {
                    // Leave game
                    const token = localStorage.getItem('access_token');
                    const gameSocket = createGameSocket(token, msg.gameId!);
                    await gameSocket.authenticate(msg.gameId!);
                    gameSocket.leaveGame();
                    gameSocket.destroy();
                    showToast(t('GameLeft'), 'success');
                } */
                // else: "Later" - do nothing
                break;
            }

            default:
            // console.log(`📨 ${t('MsgReceived')}`, message); // DB
        }
    }

    private onFriendsUpdateCallback: ((friends: Friend[]) => void) | null =
        null;

    public onFriendsUpdate(callback: (friends: Friend[]) => void) {
        //if (this.onFriendsUpdateCallback) return; // Ignorar si ya hay uno
        this.onFriendsUpdateCallback = callback;
        // Para que el sidebar pinte algo inmediatamente al llamar onFriendsUpdate()
        if (this.friends.length > 0) {
            callback([...this.friends]);
        }
    }

    // Para acceder a la lista cacheada
    public getFriends() {
        return [...this.friends];
    }

    // Para saber si alguien está o no autenticado
    public getAuthenticated() {
        return this.isAuthenticated;
    }

    private onActiveGameUpdateCallback:
        | ((state: ActiveGameState) => void)
        | null = null;

    public onActiveGameUpdate(callback: (state: ActiveGameState) => void) {
        this.onActiveGameUpdateCallback = callback;

        // Enviar estado actual inmediatamente
        callback({ ...this.activeGame });
    }

    public getActiveGame() {
        return { ...this.activeGame };
    }

    disconnect() {
        if (this.socket) {
            // console.log(`👋 ${t('ClosingWs')}`); // DB
            this.socket.close();
        }
    }
}
