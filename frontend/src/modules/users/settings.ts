import { getCurrentUser } from "@/modules/users";
import { t } from "@/app/i18n";
import { setupAvatarUpload } from "@/components/avatarUpload";
import { showToast } from "@/components/toast";
import { navigateTo } from "@/app/navigation";
import { renderAvatar } from "@/components/renderAvatar";

export async function loadSettings() {
  // console.log("Cargando dashboard..."); // DB
  const response = await getCurrentUser();

  if (!response) {
	console.warn(t("UserNotFound"));
	return;
  }

  // ✅ activa el drag & drop
  setupAvatarUpload();
  // ⭐ Activar uso de formularios
  updateUserName();
  updatePassword();

  const user = response.user; 

  //console.log("Usuario obtenido:", user); // DB

  // Actualizar elementos dinámicos
  const usernameElement = document.getElementById("user-name");
  const emailElement = document.getElementById("user-email");
  const useridElement = document.getElementById("user-id");
  const avatarElement = document.getElementById("user-avatar");

  // console.log("Elementos encontrados:", { usernameElement, emailElement, useridElement }); // DB

  // Actualizar texto
  if (usernameElement) {
	usernameElement.textContent = user.username;
  }

  if (emailElement) {
	emailElement.textContent = user.email;
  }

  if (useridElement) {
	useridElement.textContent = user.id.toString(); // Ejemplo: reemplazar "dashboard" por su id
  }

  renderAvatar(user, avatarElement);
}

// Update User Name Form
function updateUserName() {
  setTimeout(() => {
    const forms = document.querySelectorAll("form");
    const userNamerForm = forms[0];
    if (!userNamerForm) return;

    userNamerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(userNamerForm);
      const username = formData.get("username") as string;

      /* Validate all fields are filled */
      if (!username) {
        showToast(t("fillAllFields"), "error");
        return;
      }

      // Validate UserName (Regular expresion)
      // 3-20 characters
      // Only letters, numbers, hyphens, and underscores
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username)) {
        showToast(t("invalidUsername"), "error");
        return;
      }

      /* This block of code is handling the registration process for a new user. Here's a breakdown of
      what it does: */
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.warn(t("NoTokenFound"));
          showToast(t("NoTokenFound"), "error");
          navigateTo("login");
          return;
        }

        const response = await fetch("/api/user-manager/update-username", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorcode = data.error || "ErrorUpdatingUserName";
          if (errorcode === "UserAlreadyExists")
            showToast(t("UsernameAlreadyExists"), "error");
          else
            showToast(t(errorcode), "error");
          return;
        }

        // ✅ Actualizar nombre en la web
        // Funciona correctamente, pero no necesario con el navigateTo() de abajo
        /* const usernameElement = document.getElementById("user-name");
        if (usernameElement) {
          usernameElement.textContent = username;
        } */

        //alert(t("UserNameUpdatedSuccessfully"));
        showToast(t("UserNameUpdatedSuccessfully"));
        //userNamerForm.reset();
        navigateTo("settings", true, true);

      } catch (err) {
        showToast(t("NetworkOrServerError"), "error");
      }
    });
  }, 100);
}

// Update Password Form
function updatePassword() {
  setTimeout(() => {
    const forms = document.querySelectorAll("form");
    const passwordForm = forms[1];
    if (!passwordForm) return;

    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(passwordForm);
      const newPassword = formData.get("newPassword") as string;
      const repeatPassword = formData.get("repeat_password") as string;

      /* Validate all fields are filled */
      if (!newPassword || !repeatPassword) {
        showToast(t("fillAllFields"), "error");
        return;
      }

      // Validate Password (Regular expresion)
      // Minimum 8 characters.
      // At least one capital letter.
      // At least one lowercase letter.
      // At least one number.
      // Optional: At least one special character.
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        showToast(t("invalidPassword"), "error");
        return;
      }

      /* Validate if both passwords are the same */
      if (newPassword !== repeatPassword) {
        showToast(t("passwordDoNotMatch"), "error");
        return;
      }

      /* This block of code is handling the registration process for a new user. Here's a breakdown of
      what it does: */
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.warn(t("NoTokenFound"));
          showToast(t("NoTokenFound"), "error");
          navigateTo("login");
          return;
        }
        
        const response = await fetch("/api/user-manager/update-password", { // NEEDED UPDATE API ENDPOINT
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorcode = data.error?.code || data.code || "ErrorUpdatingPassword";
          showToast(t(errorcode), "error");
          return;
        }

        showToast(t("passwordUpdatedSuccessfully"));
        passwordForm.reset();

      } catch (err) {
        showToast(t("NetworkOrServerError"), "error");
      }
    });
  }, 100);
}