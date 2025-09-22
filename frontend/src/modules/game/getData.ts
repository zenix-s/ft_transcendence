
export function fetchGameId() {
  return fetch("https://localhost:3000/game/create", {
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

//endpoint para unrse a la partida
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



























/** Devuelve el usuario con el username indicado o null */
// export async function fetchUserByUsername(username: string) {
//   if (!username) return null;
//   try {
// 	const users = await fetchUsersFromBackend();
// 	return users.find((u: { username: string }) => u.username === username) ?? null;
//   } catch (err) {
// 	console.error("fetchUserByUsername error:", err);
// 	throw err;
//   }
// }



/** Devuelve el usuario con el id indicado o null */
// export async function fetchUserById(userId: number) {
//   if (typeof userId !== 'number' || Number.isNaN(userId)) return null;
//   try {
// 	const users = await fetchUsersFromBackend();
// 	return users.find((u: { id: number }) => u.id === userId) ?? null;
//   } catch (err) {
// 	console.error("fetchUserById error:", err);
// 	throw err;
//   }
// }



//   try {
// 		const response = await fetch("/api/auth/register", {
// 		  method: "POST",
// 		  headers: { "Content-Type": "application/json" },
// 		  body: JSON.stringify({ username, email, password }),
// 		});

// 		const data = await response.json();

// 		if (!response.ok) {
// 		  const errorcode = data.error?.code || data.code || "ErrorCreatingUser";
// 		  alert(t(errorcode));
// 		  return;
// 		}

// 		// ✅ Guardar el token recibido
// 		localStorage.setItem("access_token", data.token);

// 		alert(t("UserCreatedSuccessfully"));
// 		registerForm.reset();

// 		// Redirigir al dashboard
// 		navigateTo("dashboard");

// 	  } catch (err) {
// 		alert(t("NetworkOrServerError"));
// 	  };



//   //console.log("Token actual:", token); // DB
//   try {
// 	const response = await fetch("/api/auth/me", {
// 	  headers: {
// 		"Authorization": `Bearer ${token}`,
// 	  },
// 	});
// 	//console.log("Respuesta cruda:", response); // DB
// 	if (response.status === 401) {
// 	  // Token expirado o inválido
// 	  alert(t("SessionExpiredOrInvalid"));
// 	  localStorage.removeItem("access_token");
// 	  navigateTo("login");
// 	  return null;
// 	}
// 	const result = await response.json();
// 	// console.log("Contenido devuelto:", result); // DB
// 	return result;
//   } catch (err) {
// 	console.error(t("ErrorRetrievingProfile"), err);
// 	return null;
//   };



  	//    try {
	// 	  const response = await fetch("/api/auth/login", {
	// 		method: "POST",
	// 		headers: { "Content-Type": "application/json" },
	// 		body: JSON.stringify({ email, password }),
	// 	  });
  
	// 	  const data = await response.json();
  
	// 	  if (!response.ok) {
	// 		const errorcode = data.error?.code || data.code || "invalidCredentialsError";
	// 		//const errorMsg = data.error?.message || data.message || "Credenciales incorrectas";
	// 		//alert(errorMsg);
	// 		alert(t(errorcode));
	// 		return;
	// 	  }
  
	// 	  // ✅ Guardar el token recibido
	// 	  //console.log("Respuesta completa del login:", data); // DB
	// 	  localStorage.setItem("access_token", data.token);
  
	// 	  alert(t("welcome"));
	// 	  navigateTo("dashboard");
  
	// 	} catch (err) {
	// 	  console.error("Login error:", err);
	// 	  alert(t("ErrorTryingToLogIn"));
	// 	}