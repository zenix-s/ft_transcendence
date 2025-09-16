import { getCurrentUser } from "@/modules/users";

export async function loadDashboard() {
  console.log("Cargando dashboard...");
  const response = await getCurrentUser();

  if (!response) {
    console.warn("Usuario no encontrado.");
    return;
  }

  const user = response.user; 

  console.log("Usuario obtenido:", user);

  // Actualizar elementos dinámicos
  const usernameElement = document.getElementById("user-name");
  const emailElement = document.getElementById("user-email");
  const useridElement = document.getElementById("user-id");

  console.log("Elementos encontrados:", { usernameElement, emailElement, useridElement });

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