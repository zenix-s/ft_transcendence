import { getCurrentUser } from "@/modules/users";
import { t } from "@/app/i18n";


export async function loadDashboard() {
  // console.log("Cargando dashboard..."); // DB
  const response = await getCurrentUser();

  if (!response) {
    console.warn(t("UserNotFound"));
    return;
  }

  const user = response.user; 

  //console.log("Usuario obtenido:", user); // DB

  // Actualizar elementos dinámicos
  const usernameElement = document.getElementById("user-name");
  const emailElement = document.getElementById("user-email");
  const useridElement = document.getElementById("user-id");

  // console.log("Elementos encontrados:", { usernameElement, emailElement, useridElement }); // DB

  if (usernameElement) {
    usernameElement.textContent = user.username;
  }

  if (emailElement) {
    emailElement.textContent = user.email;
  }

  if (useridElement) {
    useridElement.textContent = user.id; // Ejemplo: reemplazar "dashboard" por su id
  }
}