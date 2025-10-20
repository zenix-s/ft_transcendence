import { getStats } from "@/modules/users";
import { t } from "@/app/i18n";
import type { User } from "@/types/user";
import { renderAvatar } from "@/components/renderAvatar";

export async function loadDashboard(user: User) {
  // console.log("Cargando dashboard..."); // DB
  //const response = await getCurrentUser();
  const userStats = await getStats(user.id);

  /* if (!response) {
    console.warn(t("UserNotFound"));
    return;
  } */

  if (!userStats) {
    console.warn(t("UserNotFound"));
    return;
  }

  // const user = response.user; 

  //console.log("Usuario obtenido:", user); // DB

  // Actualizar elementos dinámicos
  const usernameElement = document.getElementById("user-name");
  const emailElement = document.getElementById("user-email");
  const useridElement = document.getElementById("user-id");
  const avatarElement = document.getElementById("user-avatar");
  const totalGamesElement = document.getElementById("user-total-games");

  // console.log("Elementos encontrados:", { usernameElement, emailElement, useridElement }); // DB

  // Actualizar texto
  if (usernameElement) { usernameElement.textContent = user.username; }

  if (emailElement) { emailElement.textContent = user.email; }

  if (useridElement) { useridElement.textContent = user.id.toString(); } // Ejemplo: reemplazar "dashboard" por su id

  renderAvatar(user, avatarElement);

  if (totalGamesElement) { totalGamesElement.textContent = userStats.totalMatches; }
}
