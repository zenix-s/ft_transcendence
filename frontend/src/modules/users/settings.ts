import { t } from "@/app/i18n";
import { setupAvatarUpload } from "@/components/avatarUpload";
import { showToast } from "@/components/toast";
import { navigateTo } from "@/app/navigation";
import { renderAvatar } from "@/components/renderAvatar";
import { apiUrl } from "@/api";
import { setupColorPicker } from "@/components/colorPicker";
import type { User } from "@/types/user"
import { countInputLenght } from "@/components/inputCounter";

export async function loadSettings(user: User) {
  // ✅ activa el drag & drop
  setupAvatarUpload();
  // ⭐ Activar uso de formularios
  updateUserName();
  updatePassword();

  //const user = response.user; 

  // Actualizar elementos dinámicos
  const usernameElement = document.getElementById("user-name");
  const avatarElement = document.getElementById("user-avatar");

  // Actualizar texto
  if (usernameElement) {
	usernameElement.textContent = user.username;
  }

  // Display user avatar
  renderAvatar(user, avatarElement);

  // Inicializar selector de color
  setupColorPicker();
}

// Update User Name Form
function updateUserName() {
  setTimeout(() => {
    const forms = document.querySelectorAll("form");
    const userNamerForm = forms[0];
    if (!userNamerForm) return;

    // Char counter
    const usernameInput = userNamerForm.querySelector<HTMLInputElement>('input[name="username"]');
    countInputLenght(usernameInput);

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

        const response = await fetch(apiUrl("/user-manager/update-username"), {
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

        showToast(t("UserNameUpdatedSuccessfully"));
        navigateTo("settings", true, true);

      } catch {
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
        
        const response = await fetch(apiUrl("/user-manager/update-password"), { // NEEDED UPDATE API ENDPOINT
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

      } catch {
        showToast(t("NetworkOrServerError"), "error");
      }
    });
  }, 100);
}