import { apiUrl } from "@/api";

export function fetchGameId(matchPoints: number = 5, gameTime: number = 120, gameMode: string = "2d") {
  // return fetch("https://localhost:3000/game/pong/create", {
  return fetch(apiUrl("/game/pong/create"), {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      winnerScore: matchPoints,
      maxGameTime: gameTime,
      visualStyle: gameMode
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

export function fetchSinglePlayerGameId(winnerScore: number, aiDifficulty: number, maxTime: Number, gameMode: string) {
  // return fetch("https://localhost:3000/game/pong/create-singleplayer", {
  console.log("get id=", apiUrl("/game/pong/create-singleplayer"));
  return fetch(apiUrl("/game/pong/create-singleplayer"), {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      winnerScore: winnerScore,
      maxGameTime: maxTime,
      aiDifficulty: aiDifficulty / 10,
      visualStyle: gameMode
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

export function fetchGameAlreadyFinished(gameId:number)
{
  // return fetch("https://localhost:3000/match-history/final-state/" + gameId, {
  console.log("finish=", apiUrl("/match-history/final-state/" + gameId));
  return fetch(apiUrl("/match-history/final-state/" + gameId), {
    method: "GET",
    headers: {
      "accept": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token"),
      "Content-Type": "application/json"
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
      return data; 
    })
    .catch(error => {
      console.error("Error:", error);
      return null;
    });
}
