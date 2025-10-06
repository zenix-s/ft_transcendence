import { getCurrentUser } from "@/modules/users";
import { t } from "@/app/i18n";
import { setupAvatarUpload } from "@/components/avatarUpload";

export async function loadSettings() {
  // console.log("Cargando dashboard..."); // DB
  const response = await getCurrentUser();

  if (!response) {
	console.warn(t("UserNotFound"));
	return;
  }

  // ✅ activa el drag & drop
  setupAvatarUpload();

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
	useridElement.textContent = user.id; // Ejemplo: reemplazar "dashboard" por su id
  }

  // **Actualizar imagen**
  if (avatarElement instanceof HTMLImageElement) {
	avatarElement.src = user.avatarUrl && user.avatarUrl.trim() !== "" 
	  ? user.avatarUrl 
	  // 👆 Aquí `user.avatarUrl` debe ser la URL que te devuelve tu backend.
	  : "/images/avatar1.jpg"; // Imagen por defecto
  }
}