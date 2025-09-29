
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

import { WebSocket } from "ws";

export function conectWebSocket()
{
	const token = localStorage.getItem("access_token");
	const socket = new WebSocket("wss://localhost:3000/game", {
		headers: {
			Authorization: "Bearer ${token}",
		},
	});

	socket.addEventListener("open", () => {
		console.log("conectado websockket");
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