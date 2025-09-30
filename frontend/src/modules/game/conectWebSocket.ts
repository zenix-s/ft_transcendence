
// export function conectWebSocket()
// {
// 	import WebSocket from "ws";
// 	const token = "tu_token_aqui";
// 	const socket = new WebSocket("wss://ejemplo.com/socket", {
// 	  headers: {
// 		Authorization: `Bearer ${token}`
// 	  }
// 	});
// }

// import { WebSocket } from "ws";

interface message {
	action: number,
	gameId: number,
	token: string | null
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
	});

	socket.onopen = () => {
		console.log("Web SOCKET conectado");
		socket.send("Hola! soy el websocket del servidor");
	};

	socket.onmessage = (event) => {
		console.log("Mensaje=", event.data);
	};

	socket.onclose = () => {
		console.log("Cerrar conexion con websocket");
	};

	socket.onerror = (error) => {
		console.log("hay un error en el websocket=", error);
	};
}



// export function conectWebSocket()
// {
// 	const token = localStorage.getItem("access_token");
// 	const socket = new WebSocket(`wss://localhost:3000/game?token=${token}`);

// 	socket.onopen = () => {
// 		console.log("Web SOCKET conectado");
// 		socket.send("Hola! soy el websocket del servidor");
// 	};

// 	socket.onmessage = (event) => {
// 		console.log("Mensaje=", event.data);
// 	};

// 	socket.onclose = () => {
// 		console.log("Cerrar conexion con websocket");
// 	};

// 	socket.onerror = (error) => {
// 		console.log("hay un error en el websocket=", error);
// 	};
// }

