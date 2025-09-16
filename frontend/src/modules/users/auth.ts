/*********************************************************************************************/
/* Login, register y validaciones → Aquí irían las funciones relacionadas con autenticación. */
/*********************************************************************************************/

// import { fetchUserByUsername, fetchUserByEmail } from "@/modules/users";
import { navigateTo } from "@/app/navigation";
import { t } from "@/app/i18n";

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
        alert(t("fillAllFields"));
        return;
      }
      if (password !== repeatPassword) {
        alert(t("passwordDoNotMatch"));
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
          const errorcode = data.error?.code || data.code || "ErrorCreatingUser";
          alert(t(errorcode));
          return;
        }

        // ✅ Guardar el token recibido
        localStorage.setItem("access_token", data.token);

        alert(t("UserCreatedSuccessfully"));
        //console.log(`password send = "${password}"`); // DB
        registerForm.reset();

        // Redirigir al dashboard
        navigateTo("dashboard");

      } catch (err) {
        alert(t("NetworkOrServerError"));
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
      alert(t("fillAllFields"));
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
          alert(t(errorcode));
          return;
        }

        // ✅ Guardar el token recibido
        //console.log("Respuesta completa del login:", data); // DB
        localStorage.setItem("access_token", data.token);

        alert(t("welcome"));
        navigateTo("dashboard");

      } catch (err) {
        console.error("Login error:", err);
        alert(t("ErrorTryingToLogIn"));
      }
    });
  }, 100);
}

/* GET USER */
export async function getCurrentUser() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    console.warn(t("NoTokenFound"));
    alert(t("NoTokenFound"));
    navigateTo("login");
    return null;
  }

  //console.log("Token actual:", token); // DB
  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    //console.log("Respuesta cruda:", response); // DB
    if (response.status === 401) {
      // Token expirado o inválido
      alert(t("SessionExpiredOrInvalid"));
      localStorage.removeItem("access_token");
      navigateTo("login");
      return null;
    }

    const result = await response.json();
    // console.log("Contenido devuelto:", result); // DB
    return result;
  } catch (err) {
    console.error(t("ErrorRetrievingProfile"), err);
    return null;
  }
}