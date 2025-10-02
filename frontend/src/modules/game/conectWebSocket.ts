import { actualizeValues } from "./game"
import type { Ball, Player, Score } from "./gameData";
import { fetchGameId, fetchSinglePlayerGameId, toJoinGame, fetchGameState } from "./getData.js";

interface message {
	action: number,
	gameId: number,
	token: string | null
}

export function setAsReady(gameId: number)
{
	const token = localStorage.getItem("access_token");
	let obj: message = {
		action: 4,
		gameId: gameId,
		token: token
	};
	socket.send(JSON.stringify(obj));
}

export function conectWebSocket(gameId: number, player1: Player, player2: Player, scores: Score, ball: Ball)
{
	const token = localStorage.getItem("access_token");
	const socket = new WebSocket("wss://localhost:3000/game/pong");
	let pingInterval: NodeJS.Timeout | undefined;
	
	socket.addEventListener("open", () => {
		console.log("conectado websockket");
		let obj : message = {
			action: 0,
			gameId:gameId,
			token: token
		};
		socket.send(JSON.stringify(obj));
		obj.action = 1;
		socket.send(JSON.stringify(obj));
		obj.action = 4;
		socket.send(JSON.stringify(obj));
		obj.action = 1;
		pingInterval = setInterval(() => {
		 	socket.send(JSON.stringify(obj));


			
  		}, 10);
	})

	socket.addEventListener("message", (msg) => {
		console.log("mensaje recibido=", msg.data);
		let data = JSON.parse(msg.data);
		if (data.type ==  "gameState")
		{
			actualizeValues(data.state.player1.position, player1, data.state.player2.position, player2,
				data.state.player1.score, data.state.player2.score, scores,
				data.state.ball.position.x, data.state.ball.position.y, ball);

			if (data.state.isRunning == false && data.state.arePlayersReady == true)
			{
				clearInterval(pingInterval);
				pingInterval = undefined;
				console.log("⏹ Ping detenido porque isRunning=false");
			}
		}
	});

	socket.addEventListener("close", () => {
		console.log("Cerrar conexion con websocket");
	});

	socket.addEventListener("error", (error) => {
		console.log("hay un error en el websocket=", error);
	});

	document.addEventListener("keydown", (event) => {
		const key = event.key;
		console.log(key);
		let action = 0;
		if (key === "ArrowUp")
		{
			action = 2;
			console.log("up");
		}
		else if (key === "ArrowDown")
		{
			action = 3;
			console.log("down");
		}
		if (key === "w")
		{
			action = 2;
			console.log("w");
		}
		else if (key === "s")
		{
			action = 3
			console.log("s");
		}

		let obj : message = {
			action: action,
			gameId:gameId,
			token: token
		};
		if (action != 0)
			socket.send(JSON.stringify(obj));

		//sendAction(action);
	});
}

export async function socketAndRender(player1: Player, player2: Player, scores: Score, ball: Ball)
{
	// const gameId = await fetchGameId();
	// if (!gameId)
	// {
	// 	console.log("No game ID");
	// 	return ;
	// }
	// console.log("si gameId=", gameId);

	const gameSiglePlayerId = await fetchSinglePlayerGameId();
	if (!gameSiglePlayerId)
	{
		console.log("No single-player game ID");
		return ;
	}
	console.log("si gameSinglePlayerId=", gameSiglePlayerId);

	// const gameJoin = await toJoinGame(gameSiglePlayerId);
	// if (!gameJoin)
	// {
	// 	console.log("No join game");
	// 	return ;
	// }
	// console.log("si gameJoin=", gameJoin);

	const gameState = await fetchGameState(gameSiglePlayerId);
	if (!gameState)
	{
		console.log("no gameState");
		return ;
	}
	console.log("si gameState");

	conectWebSocket(gameSiglePlayerId, player1, player2, scores, ball);
}