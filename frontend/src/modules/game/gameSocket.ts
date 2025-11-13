import { getWsUrl } from "@/api";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { startCountdown } from "@/components/countdown";
import { modal } from "@/components/modal";
import { showToast } from "@/components/toast";
import { renderValues } from "./playing";
import type { Ball, Player, Score } from "./gameData";
import type { Engine, Scene } from "@babylonjs/core";
import { endGameAuthAndErrors } from "./authAndErrors";

interface GameStateMessage {
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
	private ready = false;
	private player1: Player;
	private player2: Player;
	private	scores: Score;
	private	ball: Ball;
	private	engine: Engine;
	private scene: Scene;
	private gameId: number;
  //private friends: Friend[] = [];

	constructor(token: string) {
		this.wsUrl = getWsUrl("/game/pong");
		this.token = token;
	}


	connect() {
		//console.log("🔌", t("ConnectingToWs"));
		console.log("conectado websockket");
		this.socket = new WebSocket(this.wsUrl);

		this.socket.addEventListener("open", () => {
			console.log("🟢", t("WsConnected"));
		})

		this.socket.addEventListener("message", async (msg) => {
			console.log("mensaje recibido=", msg.data);
			try {
				const data = JSON.parse(msg.data);
				this.handleMessage(data);
			} catch (err) {
				console.error(`❌ ${t("ErrorParsingMsg")}`, err);
			}
		})

		this.socket.onclose = () => {
			console.log("🔴", t("WsClosed"));
		};

		this.socket.onerror = (err) => {
			console.error(`⚠️ ${t("WsError")}`, err);
		};
	}

	public async authenticate(gameId:number) {
		const obj : message = {
			action : 0,
			gameId : gameId,
			token : this.token
		};
		this.socket?.send(JSON.stringify(obj));
		obj.action = 1;
		this.socket?.send(JSON.stringify(obj));
		if (this.ready == false)
		{
			const userConfirmed = await modal({type: "setReady"});
			if (!userConfirmed)
			{
				console.log("User canceled the modal");
				obj.action = 6;
				this.socket?.send(JSON.stringify(obj));
				navigateTo("dashboard", false, true);
				return ;
			}
			obj.action = 4;
			this.socket?.send(JSON.stringify(obj));
			this.ready = true;
			//startCountdown(3, "start");
		}
	}

	private async handleMessage(message: unknown) {
		// Detectar tipo
		const type = (message as { type?: unknown})?.type;
		switch (type) {
			case "gameState": {
				const data = message as GameStateMessage;
				//añadir countdown
				renderValues(data.state.player1.position, this.player1, data.state.player2.position, this.player2,
								data.state.player1.score, data.state.player2.score, this.scores,
								data.state.ball.position.x, data.state.ball.position.y, this.ball);
				break ;
			}
			case "error": {
				const data = message as ErrorMessage;
				if (data.error === "GameAlreadyFinished" || (data.error != "UnauthorizedAccess" && data.error != "GameNotFound"))
					this.engine.stopRenderLoop();
				await endGameAuthAndErrors(data.error, this.gameId, this.socket, this.player1, this.player2,
					this.scores, this.ball, this.engine);
				break;
			}
			default:
				return ;
		}
	}


	public async	play(){
		let	up = 0;
		let	down = 0;
		const	obj : message = {
			action : 1,
			gameId: this.gameId,
			token: this.token
		}
		this.socket?.send(JSON.stringify(obj));
		this.engine.runRenderLoop(() => {
			obj.action = 1;
			this.socket?.send(JSON.stringify(obj));
			if (up == 1 && down == 0)
			{
				obj.action = 3;
				this.socket?.send(JSON.stringify(obj));
			}
			else if (down === 1 && up == 0)
			{
				obj.action = 2;
				this.socket?.send(JSON.stringify(obj));
			}
			this.scene.render();
		})
		document.addEventListener("keydown", (event) => {
			const key = event.key;
			if (key === "ArrowUp" || key === "w")
				up = 1;
			if (key === "ArrowDown" || key === "s")
				down = 1;
		});
		document.addEventListener("keyup", (event) => {
			const key = event.key;
			if (key === "ArrowUp" || key === "w")
				up = 0;
			if (key === "ArrowDown" || key === "s")
				down = 0;
		});
	}

}