/*********************************************************************************************/
/* Login, register y validaciones → Aquí irían las funciones relacionadas con autenticación. */
/*********************************************************************************************/

import { fetchUserByUsername, fetchUserByEmail } from "@/modules/users";
import { navigateTo } from "@/app/navigation";

/* REGISTER NEW USER */
export function setupRegisterForm() {
  setTimeout(() => {
    const forms = document.querySelectorAll("form");
    const registerForm = forms[1];
    if (!registerForm) return;

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const username = formData.get("username") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const repeatPassword = formData.get("repeat_password") as string;

      if (!username || !email || !password || !repeatPassword) {
        alert("Por favor, rellena todos los campos.");
        return;
      }
      if (password !== repeatPassword) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error?.message || "Error al crear usuario");
          return;
        }

        // ✅ Guardar el token recibido
        localStorage.setItem("access_token", data.access_token);

        alert("Usuario creado correctamente");
        //console.log(`password send = "${password}"`); // DB
        registerForm.reset();

        // Redirigir al dashboard
        navigateTo("dashboard");

      } catch (err) {
        alert("Error de red o servidor");
      }
    });
  }, 100); // Espera breve para asegurar que el HTML está en el DOM
}

/* LOG-IN */
export function validateLogin() {
  setTimeout(() => {
    const forms = document.querySelectorAll("form");
    const loginForm = forms[0];
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!email || !password) {
      alert("Por favor, rellena todos los campos.");
      return;
      }

       try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Credenciales incorrectas");
          return;
        }

        // ✅ Guardar el token recibido
        localStorage.setItem("access_token", data.access_token);

        alert(`Bienvenido!`);
        navigateTo("dashboard");

      } catch (err) {
        console.error("Error en login:", err);
        alert("Error al intentar iniciar sesión.");
      }
    });
  }, 100);
}

/* export function validateLogin() {
  setTimeout(() => {
	const forms = document.querySelectorAll("form");
	const loginForm = forms[0];
	if (!loginForm) return;

	loginForm.addEventListener("submit", async (e) => {
	  e.preventDefault();
	  const formData = new FormData(loginForm);
	  const name_email = formData.get("user-email") as string;
	  const password = formData.get("password") as string;

	  if (!name_email || !password) {
		alert("Por favor, rellena todos los campos.");
		return;
	  }

	  try {
		// Primero intentamos buscar por username
		let user = await fetchUserByUsername(name_email);

		 // Si no existe por username, probamos por email
		if (!user) {
		  user = await fetchUserByEmail(name_email);
		}

		if (!user) {
		  alert("Usuario o email no encontrado.");
		  return;
		}

		 // ⚠️ Ojo: esto es provisional (password en claro)
		if (user.password !== password) {
		  alert("Contraseña incorrecta.");
		  return;
		}

		 // Si pasa todo → login OK
		alert(`Bienvenido ${user.username}!`);

		// Aquí podrías guardar en localStorage, redirigir, etc.
		// localStorage.setItem("user", JSON.stringify(user));
		navigateTo("dashboard");

	  } catch (err) {
		console.error("Error en login:", err);
		alert("Error al intentar iniciar sesión.");
	  }
	});
  }, 100);
} */