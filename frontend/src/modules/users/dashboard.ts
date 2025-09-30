import { getCurrentUser, getStats } from "@/modules/users";
import { t } from "@/app/i18n";

export async function loadDashboard() {
  // console.log("Cargando dashboard..."); // DB
  const response = await getCurrentUser();
  const userStats = await getStats();

  if (!response) {
    console.warn(t("UserNotFound"));
    return;
  }

  if (!userStats) {
    console.warn(t("UserNotFound"));
    return;
  }

  const user = response.user; 

  //console.log("Usuario obtenido:", user); // DB

  // Actualizar elementos dinámicos
  const usernameElement = document.getElementById("user-name");
  const emailElement = document.getElementById("user-email");
  const useridElement = document.getElementById("user-id");
  const avatarElement = document.getElementById("user-avatar");
  const totalGamesElement = document.getElementById("user-total-games");

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
      : "/images/avatar.jpg"; // Imagen por defecto
  }

  if (totalGamesElement) {
    totalGamesElement.textContent = userStats.totalMatches;
  }
}
