
export function fetchGameId() {
  return fetch("https://localhost:3000/game/pong/create", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      winnerScore: 5,
      maxGameTime: 120
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Error en la petición: " + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log("Respuesta del servidor:", data);
      return data.gameId;   // ✅ devolvemos el gameId
    })
    .catch(error => {
      console.error("Error:", error);
      return null;
    });
}

export function fetchSinglePlayerGameId() {
  return fetch("https://localhost:3000/game/pong/create-singleplayer", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      winnerScore: 5,
      maxGameTime: 120,
      aiDifficulty: 0.95
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Error en la petición: " + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log("Respuesta del servidor:", data);
      return data.gameId;   // ✅ devolvemos el gameId
    })
    .catch(error => {
      console.error("Error:", error);
      return null;
    });
}

export function toJoinGame(gameId:any) {
  return fetch("https://localhost:3000/game/pong/join/" + gameId, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      gameId: gameId
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Error en la petición: " + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log("Respuesta del servidor:", data);
      return data;   // ✅ devolvemos respuesta completa
    })
    .catch(error => {
      console.error("Error:", error);
      return null;
    });
}

export function fetchGameState(gameId:any)
{
  return fetch("https://localhost:3000/game/pong/state/" + gameId, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token")
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Error en la petición: " + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log("Respuesta del servidor:", data);
      return data;   // ✅ devolvemos respuesta completa
    })
    .catch(error => {
      console.error("Error:", error);
      return null;
    });
}

//guardar esto:   "userId": "182ed9a4-d773-46e7-a303-b7f3a48ad13a",
// de 0 a 100

// export async function fetchGameId()
// {
// 	fetch("https://localhost:3000/game/create", {
// 	  method: "POST",
// 	  headers: {
//  	   "accept": "application/json",
//  	   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiJpbmVzIiwiZW1haWwiOiJob2xhQGdtYWlsLmNvbSIsImlhdCI6MTc1ODUzNjQ4MCwiZXhwIjoxNzU4NjIyODgwfQ.bjp9fLPY_r_ZogyFwqSfk_xdR2wFQ6-7kqWyH1XPuOQ",
// 	    "Content-Type": "application/json"
// 	  },
// 	  body: JSON.stringify({
// 	    winnerScore: 5,
//     	maxGameTime: 120
//   		})
// 	})
//   .then(response => {
//     if (!response.ok) {
//       throw new Error("Error en la petición: " + response.status);
//     }
//     return response.json();
//   })
//   .then(data => {
//     console.log("Respuesta del servidor:", data);
// 	return data.gameId;
//   })
//   .catch(error => {
//     console.error("Error:", error);
// 	return null;
//   });

// }


// export async function fetchGameId()
// {
// 	try {
// 		const response = await fetch("https://localhost:3000/game/create", {
// 			method: "POST",
// 			headers: {
// 				"Content-Type": "application/jason",
// 				"Accept": "application/json",
// 				"Authorization": "Bearer " + localStorage.getItem("access_token")
// 			},
// 			body: JSON.stringify({
// 				winnerScore: 5,
// 				maxGameTime: 120
// 			})
// 		});
// 		if (!response.ok){
// 			console.log("Error: no jueego");
// 			throw new Error("Error crear juego" + response.status);
// 		}
// 		const data = await response.json();

// 		//data tien message:string, gameId:string
// 		console.log("Data=", data);
// 		console.log("GameId=", data.gameId);
// 		return (data.gameId);
// 	} catch (error) {
// 		console.error("Error creando el juego", error);
// 		return (null);
// 	}
// }
