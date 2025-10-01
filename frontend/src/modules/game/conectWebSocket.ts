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

export function conectWebSocket(gameId: number)
{
	const token = localStorage.getItem("access_token");
	const socket = new WebSocket("wss://localhost:3000/game/pong");

	socket.addEventListener("open", () => {
		console.log("conectado websockket");
		let obj : message = {
			action: 0,
			gameId:gameId,
			token: token
		};
		socket.send(JSON.stringify(obj));
		obj.action = 1;
		// let pingInterval = setInterval(() => {
    	// 	// log(`SENT: ping: ${counter}`);
		 	socket.send(JSON.stringify(obj));
  		// }, 10);
	})

	socket.addEventListener("message", (msg) => {
		console.log("mensaje recibido=", msg.data);
		let data = JSON.parse(msg.data);
		if (data.type ==  "gameState")
		{
			console.log("gameIDd=", data.gameId);
			console.log("isSinglePlayer=", data.isSinglePlayer);
			
			console.log("isRunning=", data.isRunning);
			console.log("arePlayersReady=", data.arePlayersReady);

			console.log("isGameOver=", data.isGameOver);
			console.log("winner=", data.winner);

			console.log("gameTimer=", data.gameTimer);
			console.log("gameRules=", data.gameRules);
			console.log("maxGameTime=", data.maxGameTime);
		
			console.log("player1=", data.player1);
			console.log("player2=", data.player2);
			console.log("ball=", data.ball);
		}
	});


	socket.addEventListener("close", () => {
		console.log("Cerrar conexion con websocket");
	});

	socket.addEventListener("error", (error) => {
		console.log("hay un error en el websocket=", error);
	});
}
