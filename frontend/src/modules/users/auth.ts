/*********************************************************************************************/
/* Login, register y validaciones → Aquí irían las funciones relacionadas con autenticación. */
/*********************************************************************************************/

// import { fetchUserByUsername, fetchUserByEmail } from "@/modules/users";
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

        // Eliminar token anterior
        // localStorage.removeItem("access_token");

        // ✅ Guardar el token recibido
        localStorage.setItem("access_token", data.token);

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
          const errorMsg = data.error?.message || data.message || "Credenciales incorrectas";
          alert(errorMsg);
          return;
        }

        // ✅ Guardar el token recibido
        console.log("Respuesta completa del login:", data); // DB
        localStorage.setItem("access_token", data.token);

        alert(`Bienvenido!`);
        navigateTo("dashboard");

      } catch (err) {
        console.error("Error en login:", err);
        alert("Error al intentar iniciar sesión.");
      }
    });
  }, 100);
}

/* GET USER */
export async function getCurrentUser() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    console.warn("No token found. User probably not logged in.");
    alert("No token found. User probably not logged in.");
    navigateTo("login");
    return null;
  }

  console.log("HOLA!!"); // DB
  console.log("Token actual:", token); // DB
  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    console.log("Respuesta cruda:", response);
    if (response.status === 401) {
      // Token expirado o inválido
      alert("Sesión expirada o inválida. Por favor, inicia sesión nuevamente.");
      localStorage.removeItem("access_token");
      navigateTo("login");
      return null;
    }

    const result = await response.json();
    console.log("Contenido devuelto:", result); // DB
    return result;
  } catch (err) {
    console.error("Error al obtener el perfil:", err);
    return null;
  }
}