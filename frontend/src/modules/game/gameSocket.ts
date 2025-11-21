import { getWsUrl } from "@/api";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { modal } from "@/components/modal";
import { showToast } from "@/components/toast";
import { renderValues } from "./game";
import type { Ball, Player, Score } from "./gameData";
import type { Engine, Scene } from "@babylonjs/core";
import { endGameAndErrors } from "./authAndErrors";
import { Actions } from "@/types/gameOptions"

export interface GameStateMessage {
	type: "gameState";
	gameId: number;
	state: GameState;
}

interface GameState {
	gameStatus: string;
	gameTimer: number;
	player1: PlayerState;
	player2: PlayerState;
	ball: BallState;
	arePlayersReady: boolean;
	gameRules: GameRules;
	isGameOver: boolean;
	winner: Winner | null;
	isSinglePlayer: boolean;
	isCancelled: boolean;
	countdownInfo: CountdownInfo;
}

interface PlayerState {
	id: string;
	username: string;
	position: number;
	score: number;
	isReady: boolean;
}

interface BallState {
	position: {
		x: number;
		y: number;
	};
	velocity: {
		x: number;
		y: number;
	};
}

interface GameRules {
	winnerScore: number;
	maxGameTime: number;
	difficulty: number;
}

interface Winner {
	id: string;
	username: string;
	score: number;
}

interface CountdownInfo {
	type: string | null;
	remainingTime: number;
	isActive: boolean;
}

interface message {
	action: number,
	gameId: number,
	token: string | null
}

interface ErrorMessage {
	type: "error";
	error: string;
}

export class GameWebSocket {
	private socket: WebSocket | null = null;
	private token: string;
	private wsUrl: string;
	private start: number;
	private div: HTMLDivElement | null = null;
	private ready: boolean;
	private player1: Player | undefined;
	private player2: Player | undefined;
	private	scores: Score | undefined;
	private	ball: Ball | undefined;
	private	engine: Engine | undefined;
	private scene: Scene | undefined;
	private gameId: number;
	private moveUp?: ((event: KeyboardEvent) => void);
	private moveDown?: ((event: KeyboardEvent) => void);
	private up: number;
	private down: number;

	constructor(token: string) {
		this.wsUrl = getWsUrl("/game/pong");
		this.token = token;
		this.gameId = 0;
		this.div = null;
		this.start = 0;
		this.up = 0;
		this.down = 0;
		this.ready = false;
	}

	connect() {
		this.socket = new WebSocket(this.wsUrl);

		this.socket.addEventListener("open", () => {
			console.log("🟢", t("game"), ": ", t("WsConnected"));
		})

		this.socket.addEventListener("message", async (msg) => {
			console.log("mensaje recibido=", msg.data);
			try {
				const data = JSON.parse(msg.data);
				this.handleMessage(data);
			} catch (err) {
				console.error(`❌ ${t("game")}: ${t("ErrorParsingMsg")}`, err);
			}
		})

		this.socket.onclose = () => {
			console.log("🔴", t("game"), ": ", t("WsClosed"));
		};

		this.socket.onerror = (err) => {
			console.error(`⚠️ ${t("game")}: ${t("WsError")}`, err);
		};
	}

	private waitForOpen(): Promise<void> {
		return new Promise((resolve) => {
			if (this.socket?.readyState === WebSocket.OPEN) {
				resolve();
				return;
			}
			this.socket?.addEventListener("open", () => resolve(), { once: true });
		});
	}

	public async checkSocket()
	{
		await this.waitForOpen();
		if (!this.socket)
		{
			console.log("cramos el wss");
			this.socket = new WebSocket(this.wsUrl);
		}
		console.log("wss ya creadooo");
	}

	public async authenticate(gameId:number) {
		await this.waitForOpen();
		const obj : message = {
			action : Actions.AUTH,
			gameId : gameId,
			token : this.token
		};
		this.socket?.send(JSON.stringify(obj));
		obj.action = Actions.REQUEST_STATE;
		this.socket?.send(JSON.stringify(obj));
		console.log("ready = ", this.ready);
//		if (this.ready == false)
//		{
			const userConfirmed = await modal({type: "setReady"});
			if (!userConfirmed)
			{
				console.log("User canceled the modal");
				obj.action = Actions.LEAVE_GAME;
				this.socket?.send(JSON.stringify(obj));
				navigateTo("dashboard", false, true);
				return ;
			}
			obj.action = Actions.SET_READY;
			this.socket?.send(JSON.stringify(obj));
			this.ready = true;
//		}
		console.log("ready = ", this.ready);
	}

	public async setEvents()
	{
		await this.waitForOpen();
		this.moveUp = (event: KeyboardEvent) => {
			const key = event.key;
			if (key === "ArrowUp" || key === "w")
				this.down = 1;
			if (key === "ArrowDown" || key === "s")
				this.up = 1;
		}
		this.moveDown = (event: KeyboardEvent) => {
			const key = event.key;
			if (key === "ArrowUp" || key === "w")
				this.down = 0;
			if (key === "ArrowDown" || key === "s")
				this.up = 0;
		}
		document.addEventListener("keyup", this.moveDown);
		document.addEventListener("keydown", this.moveUp);
	}

	private async handleMessage(message: unknown) {
		// Detectar tipo
		const type = (message as { type?: unknown})?.type;
		switch (type) {
			case "gameState": {
				const data = message as GameStateMessage;
				this.countdown(data);
				renderValues(data.state.player1.position, this.player1, data.state.player2.position, this.player2,
								data.state.player1.score, data.state.player2.score, this.scores,
								data.state.ball.position.x, data.state.ball.position.y, this.ball);
				break ;
			}
			case "error": {
				const data = message as ErrorMessage;
				if (data.error === "GameAlreadyFinished" || (data.error != "UnauthorizedAccess" && data.error != "GameNotFound"))
				{
					document.removeEventListener("keydown", this.moveUp!);
    				document.removeEventListener("keyup", this.moveDown!);
					this.moveUp = undefined;
					this.moveDown = undefined;
					this.engine?.stopRenderLoop();
				}
				await endGameAndErrors(data.error, this.gameId, this.player1, this.player2,
					this.scores, this.ball);
				break;
			}
			default:
				return ;
		}
	}

	public initializeGame(gameId:number, player1: Player, player2: Player, scores: Score, ball: Ball, engine : Engine, scene : Scene)
	{
		this.gameId = gameId;
		this.player1 = player1;
		this.player2 = player2;
		this.scores = scores;
		this.ball = ball;
		this.engine = engine;
		this.scene = scene;
	}

	public async	play(){
		await this.waitForOpen();
		const	obj : message = {
			action : Actions.REQUEST_STATE,
			gameId: this.gameId,
			token: this.token
		}
		this.socket?.send(JSON.stringify(obj));
		this.engine?.runRenderLoop(() => {
			obj.action = Actions.REQUEST_STATE;
			this.socket?.send(JSON.stringify(obj));
			if (this.up == 1 && this.down == 0)
			{
				obj.action = Actions.MOVE_UP;
				this.socket?.send(JSON.stringify(obj));
			}
			else if (this.down === 1 && this.up == 0)
			{
				obj.action = Actions.MOVE_DOWN;
				this.socket?.send(JSON.stringify(obj));
			}
			this.scene?.render();
		})
	}

	public invitationAcepted()
	{
		showToast(t("invitationAcceppted"), "success");
	}

	public invitationRejected(gameId:number)
	{
		const obj : message = {
			action : Actions.AUTH,
			gameId : gameId,
			token : this.token
		};
		showToast(t("invitationRejected"), "error");
		obj.action = Actions.LEAVE_GAME;
		this.socket?.send(JSON.stringify(obj));
		navigateTo("dashboard", false, true);
		return ;
	}

	private countdown(data: GameStateMessage) {

		if (data.state.countdownInfo.isActive === true)
		{
			if (!this.div) {
				const div_cpy = document.createElement("div");

				div_cpy.className =
					"fixed inset-0 flex items-center justify-center pointer-events-none text-white font-extrabold drop-shadow-[0_0_25px_rgba(0,0,0,0.9)] text-9xl";

				div_cpy.style.zIndex = "999999";
				if (this.start === 0)
					div_cpy.classList.add("animate-ping");
				this.start = 1;
				document.body.appendChild(div_cpy);
				this.div = div_cpy;
				div_cpy.style.animationIterationCount = "3";
			}
			this.div.textContent = data.state.countdownInfo.remainingTime.toString();
			return;
		}

		if (this.div) {
			this.div.remove();
			this.div = null;
			this.start = 0;
		}
	}

	public destroy() {
		console.log("holiwis");
		// if (this.socket)
		// {
		//     console.log(`${t("game")}: ${t("ClosingWs")}`);
      	// 	this.socket.close();
		// 	this.socket = null;
		// }
		// console.log(`${t("game")}: INSTANCE DELETED`);
		// instance = null;
	}
}

let instance: GameWebSocket | null = null;

export function createGameSocket(token: string| null): GameWebSocket {
  if (!token) throw new Error("❌ No se puede crear WebSocket sin token válido");
  if (!instance) {
	instance = new GameWebSocket(token);
	instance.connect();
  }
  instance.checkSocket();
  return instance;
}

export function getGameSocket(): GameWebSocket | null {
  return instance;
}
