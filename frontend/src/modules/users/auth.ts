/*********************************************************************************************/
/* Login, register y validaciones → Aquí irían las funciones relacionadas con autenticación. */
/*********************************************************************************************/

// import { fetchUserByUsername, fetchUserByEmail } from "@/modules/users";
import { navigateTo } from "@/app/navigation";
import { t } from "@/app/i18n";
import { showToast } from "@/components/toast";

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


      /* Validate all fields are filled */
      if (!username || !email || !password || !repeatPassword) {
        showToast(t("fillAllFields"), "error");
        return;
      }

      /* Validate UserName (Regular expresion)
      3-20 characters
      Only letters, numbers, hyphens, and underscores
      */
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username)) {
        showToast(t("invalidUsername"), "error");
        return;
      }

      /* Validate Email (Regular expresion)
      string + '@' + string + '.' + string
      */
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast(t("invalidEmail"), "error");
        return;
      }

      /* Validate Password (Regular expresion)
      Minimum 8 characters.
      At least one capital letter.
      At least one lowercase letter.
      At least one number.
      Optional: At least one special character.
      */
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(password)) {
        showToast(t("invalidPassword"), "error");
        return;
      }

      /* Validate if both passwords are the same */
      if (password !== repeatPassword) {
        showToast(t("passwordDoNotMatch"), "error");
        return;
      }

      /* This block of code is handling the registration process for a new user. Here's a breakdown of
      what it does: */
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorcode = data.error?.code || data.code || "ErrorCreatingUser";
          showToast(t(errorcode), "error");
          return;
        }

        // ✅ Guardar el token recibido
        localStorage.setItem("access_token", data.token);

        showToast(t("UserCreatedSuccessfully"));
        registerForm.reset();

        // Redirigir al dashboard
        navigateTo("dashboard");

      } catch (err) {
        showToast(t("NetworkOrServerError"), "error");
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
      showToast(t("fillAllFields"), "error");
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
          const errorcode = data.error?.code || data.code || "invalidCredentialsError";
          //const errorMsg = data.error?.message || data.message || "Credenciales incorrectas";
          //alert(errorMsg);
          showToast(t(errorcode), "error");
          return;
        }

        // ✅ Guardar el token recibido
        //console.log("Respuesta completa del login:", data); // DB
        localStorage.setItem("access_token", data.token);

        showToast(t("welcome"));
        navigateTo("dashboard");

      } catch (err) {
        console.error("Login error:", err);
        showToast(t("ErrorTryingToLogIn"), "error");
      }
    });
  }, 100);
}

/* GET USER */
let sessionHandled = false;

export async function getCurrentUser() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    handleInvalidSession("NoTokenFound");
    return null;
  }

  //console.log("Token actual:", token); // DB
  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.status === 401) {
      // Token expirado o inválido
      handleInvalidSession("SessionExpiredOrInvalid");
      return null;
    }

    // Usuario no encontrado según tu backend
    if (result?.error === "userNotFoundError") {
      handleInvalidSession("UserNotFound");
      return null;
    }

    // Otro error inesperado
    if (!response.ok) {
      console.error("Error inesperado al obtener usuario:", result);
      if (!sessionHandled) showToast(t("ErrorRetrievingProfile"), "error");
      return null;
    }

    // console.log("Contenido devuelto:", result); // DB
    return result;
  } catch (err) {
    console.error(t("ErrorRetrievingProfile"), err);
    if (!sessionHandled) showToast(t("ErrorRetrievingProfile"), "error");
    return null;
  }
}

function handleInvalidSession(messageKey: string) {
  if (!sessionHandled) {
    sessionHandled = true;
    showToast(t(messageKey), "error");
    localStorage.removeItem("access_token");
    navigateTo("login");
  }
}

/* MATCH-HISTORY/STATS (Doughnut Graph) */
export async function getStats() {
  const token = localStorage.getItem("access_token");

  // Getting ID
  const userResponse = await getCurrentUser();
  /* if (!userResponse) {
    console.warn(t("UserNotFound"));
    return;
  } */

  const userId = userResponse.user.id;

  try {
    const response = await fetch("/api/match-history/stats/" + userId, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (err) {
    console.error("Error fetching stats:", err);
    return null;
  }
}

/* MATCH-HISTORY/USER (History) */
export async function getHistory() {
  const token = localStorage.getItem("access_token");

  // Getting ID
  const userResponse = await getCurrentUser();
  if (!userResponse) {
    console.warn(t("UserNotFound"));
    return;
  }

  const userId = userResponse.user.id;

  try {
    return await fetch("/api/match-history/user/" + userId, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    return null;
  }
}
