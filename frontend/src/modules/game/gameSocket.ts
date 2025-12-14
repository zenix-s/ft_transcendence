import { getWsUrl } from '@/api';
import { t } from '@/app/i18n';
import { navigateTo } from '@/app/navigation';
import { modal } from '@/components/modal';
import { showToast } from '@/components/toast';
import { adjustCanvasSize, renderValues } from './game';
import type { BabylonElements } from './gameBabylonInterfaces';
import type { Scene } from '@babylonjs/core';
import { endGameAndErrors } from './authAndErrors';
import { Actions } from '@/types/gameOptions';
import { getCurrentUser } from '../users';
import Swal from 'sweetalert2';
import type { HTMLelements } from './gameHTMLInterfaces';
import type { ErrorMessage, events, GameStateMessage, message } from './gameSocketInterfaces';

export class GameWebSocket {
    private socket: WebSocket | null = null;
    private token: string;
    private wsUrl: string;
    private gameId: number;
    private start: number;
    private div: HTMLDivElement | null = null;
    private ready: boolean;
    private gameMode: string | null = null;
    private htmlElements?: HTMLelements;
    private babylonElements?: BabylonElements;
    private events?: events;
    private up: number;
    private down: number;

    constructor(token: string, id: number) {
        this.wsUrl = getWsUrl('/game/pong');
        this.token = token;
        this.gameId = id;
        this.div = null;
        this.start = 0;
        this.up = 0;
        this.down = 0;  
        this.ready = false;
    }

    connect() {
        this.socket = new WebSocket(this.wsUrl);

        this.socket.addEventListener('open', () => {
            // console.log('🟢', t('game'), ': ', t('WsConnected')); // DB
        });

        this.socket.addEventListener('message', async (msg) => {
            try {
                const data = JSON.parse(msg.data);
                this.handleMessage(data);
            } catch (err) {
                console.error(`❌ ${t('game')}: ${t('ErrorParsingMsg')}`, err);
                this.babylonElements?.engine.stopRenderLoop();
            }
        });

        this.socket.onclose = () => {
            // console.log('🔴', t('game'), ': ', t('WsClosed')); // DB
            this.babylonElements?.engine.stopRenderLoop();
        };

        this.socket.onerror = (err) => {
            console.error(`⚠️ ${t('game')}: ${t('WsError')}`, err);
            this.babylonElements?.engine.stopRenderLoop();
        };
    }

    private waitForOpen(): Promise<void> {
        return new Promise((resolve) => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }
            this.socket?.addEventListener('open', () => resolve(), {
                once: true,
            });
        });
    }

    public async checkSocket() {
        await this.waitForOpen();
        if (!this.socket) this.socket = new WebSocket(this.wsUrl);
    }

    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    public setAuth() {
        this.ready = true;
    }

    public getGameView() {
        return this.gameMode;
    }

    public async authenticate(gameId: number) {
        await this.waitForOpen();
        this.gameId = gameId;
        const obj: message = {
            action: Actions.AUTH,
            gameId: gameId,
            token: this.token,
        };
        this.socket?.send(JSON.stringify(obj));
        obj.action = Actions.REQUEST_STATE;
        this.socket?.send(JSON.stringify(obj));
    }

    private async openModal(data: GameStateMessage) {
        const obj: message = {
            action: Actions.AUTH,
            gameId: this.gameId,
            token: this.token,
        };
        const userResponse = await getCurrentUser();
        if (!userResponse || !localStorage.getItem('access_token')) {
            console.warn(t('UserNotFound'));
            return;
        }
        const user = userResponse.user.id;
        let color = 'blue';
        if (user === Number(data.state.player2?.id)) color = 'red';
        const userConfirmed = await modal({
            type: 'setReady',
            playerColor: color,
        });
        if (!userConfirmed) {
            // console.log('User canceled the modal'); // DB
            obj.action = Actions.LEAVE_GAME;
            this.socket?.send(JSON.stringify(obj));
            this.destroy();
            navigateTo('dashboard', false, true);
            return;
        }
        obj.action = Actions.SET_READY;
        this.socket?.send(JSON.stringify(obj));
    }

    private async setEvents() {
        await this.waitForOpen();
        
        this.events = {
            // KEYS EVENTS
            keyMove: (event: KeyboardEvent) => {
                const key = event.key;
                if (key === 'ArrowUp' || key === 'w') this.up = 1;
                if (key === 'ArrowDown' || key === 's') this.down = 1;
            },
            keyStop: (event: KeyboardEvent) => {
                const key = event.key;
                if (key === 'ArrowUp' || key === 'w') this.up = 0;
                if (key === 'ArrowDown' || key === 's') this.down = 0;
            },
            // BUTTONS EVENTS
            buttonUpPressed: (event: Event) => {
                event.preventDefault();
                this.up = 1;
            },
            buttonUpReleased: (event: Event) => {
                event.preventDefault();
                this.up = 0;
            },
            buttonDownPressed: (event: Event) => {
                event.preventDefault();
                this.down = 1;
            },
            buttonDownReleased: (event: Event) => {
                event.preventDefault();
                this.down = 0;
            },
            // RESIZE EVENT
            handleResize: () => {
                const canvas = document.getElementById(
                    'gameCanvas'
                ) as HTMLCanvasElement;
                if (!canvas || !this.babylonElements)
                    return;
                adjustCanvasSize(canvas, this.babylonElements.engine);
            },
        };

        // KEYS EVENTS
        document.addEventListener('keyup', this.events.keyStop);
        document.addEventListener('keydown', this.events.keyMove);

        // BUTTONS MOBILE EVENTS
        this.htmlElements?.buttons.buttonUp.addEventListener('touchstart', this.events.buttonUpPressed);
        this.htmlElements?.buttons.buttonUp.addEventListener('touchend', this.events.buttonUpReleased);
        this.htmlElements?.buttons.buttonDown.addEventListener('touchstart', this.events.buttonDownPressed);
        this.htmlElements?.buttons.buttonDown.addEventListener('touchend', this.events.buttonDownReleased);

        // BUTTONS CLICK EVENTS
        this.htmlElements?.buttons.buttonUp.addEventListener('mousedown', this.events.buttonUpPressed);
        this.htmlElements?.buttons.buttonUp.addEventListener('mouseup', this.events.buttonUpReleased);
        this.htmlElements?.buttons.buttonUp.addEventListener('mouseleave', this.events.buttonUpReleased);

        this.htmlElements?.buttons.buttonDown.addEventListener('mousedown', this.events.buttonDownPressed);
        this.htmlElements?.buttons.buttonDown.addEventListener('mouseup', this.events.buttonDownReleased);
        this.htmlElements?.buttons.buttonDown.addEventListener(
            'mouseleave',
            this.events.buttonDownReleased
        );

        // RESIZE EVENT
        window.addEventListener('resize', this.events.handleResize);
    }

    public async removeEvents() {
        if (!this.events) return;

        // REMOVE KEYS EVENTS
        document.removeEventListener('keyup', this.events.keyMove!);
        document.removeEventListener('keydown', this.events.keyStop!);

        // REMOVE BUTTONS EVENTS
        this.htmlElements?.buttons.buttonUp.removeEventListener('touchstart', this.events.buttonUpPressed!);
        this.htmlElements?.buttons.buttonUp.removeEventListener('touchend', this.events.buttonUpReleased!);
        this.htmlElements?.buttons.buttonDown.removeEventListener(
            'touchstart',
            this.events.buttonDownPressed!
        );
        this.htmlElements?.buttons.buttonDown.removeEventListener(
            'touchend',
            this.events.buttonDownReleased!
        );

        this.htmlElements?.buttons.buttonUp.removeEventListener('mousedown', this.events.buttonUpPressed!);
        this.htmlElements?.buttons.buttonUp.removeEventListener('mouseup', this.events.buttonUpReleased!);
        this.htmlElements?.buttons.buttonUp.removeEventListener(
            'mouseleave',
            this.events.buttonUpReleased!
        );

        this.htmlElements?.buttons.buttonDown.removeEventListener(
            'mousedown',
            this.events.buttonDownPressed!
        );
        this.htmlElements?.buttons.buttonDown.removeEventListener(
            'mouseup',
            this.events.buttonDownReleased!
        );
        this.htmlElements?.buttons.buttonDown.removeEventListener(
            'mouseleave',
            this.events.buttonDownReleased!
        );

        // REMOVE RESIZE EVENT
        window.removeEventListener('resize', this.events.handleResize);
        this.events = undefined;
    }

    private async handleMessage(message: unknown) {
        await this.waitForOpen();
        // Detectar tipo
        const type = (message as { type?: unknown })?.type;
        switch (type) {
            case 'gameState': {
                const data = message as GameStateMessage;
                this.gameMode = data.state.gameRules.visualStyle;
                this.updateTimer(data);
                if (data.state.gameStatus === 'waiting_for_players') {
                    // console.log('NO SECOND_PLAYER'); // DB
                    break;
                }
                if (data.state.gameStatus === 'waiting_for_ready') {
                    if (this.ready == false) {
                        this.ready = true;
                        this.openModal(data);
                    }
                    break;
                }
                this.countdown(data);
                renderValues(
                    data.state.player1.position,
                    this.babylonElements?.playerLeft,
                    data.state.player2.position,
                    this.babylonElements?.playerRight,
                    data.state.player1.score,
                    data.state.player2.score,
                    this.babylonElements?.scores,
                    data.state.ball.position.x,
                    data.state.ball.position.y,
                    this.babylonElements?.ball
                );
                break;
            }
            case 'error': {
                const data = message as ErrorMessage;
                if (data.error === 'GameCancelled') {
                    // console.log('cerrar modal'); // DB
                    showToast(t('GameCancelled'), 'error');
                    Swal.close();
                }
                if (data.error == 'PlayerNotInGame') this.removeEvents();
                if (
                    data.error === 'GameAlreadyFinished' ||
                    (data.error != 'UnauthorizedAccess' &&
                        data.error != 'GameNotFound' &&
                        data.error != 'PlayerNotInGame')
                ) {
                    this.removeEvents();
                    this.babylonElements?.engine?.stopRenderLoop();
                }
                await endGameAndErrors(
                    data.error,
                    this.gameId,
                    this.babylonElements?.playerLeft,
                    this.babylonElements?.playerRight,
                    this.babylonElements?.scores,
                    this.babylonElements?.ball
                );
                break;
            }
            default:
                return;
        }
    }

    public getGameMode() {
        return this.gameMode;
    }

    public setScene(scene: Scene) {
        if (!this.babylonElements)
            return;
        this.babylonElements.scene = scene;
    }

    public getScene() {
        return this.babylonElements?.scene;
    }

    public getButtons() {
        return (this.htmlElements?.buttons);
    }

    public initializeGame(
        gameId: number,
        htmlElements: HTMLelements,
        babylonElements: BabylonElements
    ) {
        this.gameId = gameId;
        this.babylonElements = babylonElements;
        this.htmlElements = htmlElements;
        this.setEvents();
    }

    private updateTimer(data: GameStateMessage) {
        const time = data.state.gameRules.maxGameTime - data.state.gameTimer;
        if (!this.htmlElements?.timer) return;
        this.htmlElements.timer.textContent = time.toFixed().toString();
    }

    public async play() {
        await this.waitForOpen();
        const obj: message = {
            action: Actions.REQUEST_STATE,
            gameId: this.gameId,
            token: this.token,
        };
        this.socket?.send(JSON.stringify(obj));
        this.babylonElements?.engine?.runRenderLoop(() => {
            obj.action = Actions.REQUEST_STATE;
            this.socket?.send(JSON.stringify(obj));
            if (this.up == 1 && this.down == 0) {
                obj.action = Actions.MOVE_UP;
                this.socket?.send(JSON.stringify(obj));
            } else if (this.down === 1 && this.up == 0) {
                obj.action = Actions.MOVE_DOWN;
                this.socket?.send(JSON.stringify(obj));
            }
            this.babylonElements?.scene?.render();
        });
    }

    public invitationAcepted() {
        showToast(t('invitationAcceppted'), 'success');
    }

    public invitationRejected() {
        showToast(t('invitationRejected'), 'error');
        this.leaveGame();
        this.destroy();
        return;
    }

    public leaveGame() {
        const obj: message = {
            action: Actions.LEAVE_GAME,
            gameId: this.gameId,
            token: this.token,
        };
        this.socket?.send(JSON.stringify(obj));
        // navigateTo('dashboard', false, true);
    }

    private countdown(data: GameStateMessage) {
        if (data.state.countdownInfo.isActive === true) {
            if (!this.div) {
                const div_cpy = document.createElement('div');

                div_cpy.className =
                    'fixed inset-0 flex items-center justify-center pointer-events-none text-white font-extrabold drop-shadow-[0_0_25px_rgba(0,0,0,0.9)] text-9xl';

                div_cpy.style.zIndex = '999999';
                if (this.start === 0) div_cpy.classList.add('animate-ping');
                this.start = 1;
                document.body.appendChild(div_cpy);
                this.div = div_cpy;
                div_cpy.style.animationIterationCount = '3';
            }
            this.div.textContent =
                data.state.countdownInfo.remainingTime.toString();
            return;
        }

        if (this.div) {
            this.div.remove();
            this.div = null;
            this.start = 0;
        }
    }

    public destroy() {
        this.removeEvents();
        if (this.div) {
            this.div.remove();
            this.div = null;
            this.start = 0;
        }
        if (this.socket) {
            // console.log(`${t('game')}: ${t('ClosingWs')}`); // DB
            this.socket.close();
            this.socket = null;
        }
        // console.log(`${t('game')}: INSTANCE DELETED`); // DB
        instance = null;
    }
}

let instance: GameWebSocket | null = null;

export function createGameSocket(
    token: string | null,
    id: number
): GameWebSocket {
    if (!token)
        throw new Error('❌ No se puede crear WebSocket sin token válido');
    if (!instance) {
        instance = new GameWebSocket(token, id);
        instance.connect();
    }
    instance.checkSocket();
    return instance;
}

export function getGameSocket(): GameWebSocket | null {
    return instance;
}
