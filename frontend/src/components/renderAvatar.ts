import type { User } from "@/types/user";

export function renderAvatar(user: User, avatarElement: HTMLElement | null) {
	// **Actualizar imagen**
  if (avatarElement instanceof HTMLImageElement) {
	avatarElement.src = user.avatar && user.avatar.trim() !== "" 
	  ? "https://localhost:3000" + user.avatar 
	  // 👆 Aquí `user.avatarUrl` debe ser la URL que te devuelve tu backend.
	  : "/images/avatar1.jpg"; // Imagen por defecto
  }
}