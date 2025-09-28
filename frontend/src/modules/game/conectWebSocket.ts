
export function conectWebSocket()
{
	const socket = new WebSocket("wss://localhost:3000/game");

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