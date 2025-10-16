
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

export function fetchSinglePlayerGameId(winnerScore: number, aiDifficulty: number) {
  return fetch("https://localhost:3000/game/pong/create-singleplayer", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      winnerScore: winnerScore,
      maxGameTime: 120,
      aiDifficulty: aiDifficulty / 10
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
