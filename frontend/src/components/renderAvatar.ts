import type { User } from "@/types/user";
import type { Friend } from "@/types/friend";
import { API_BASE_URL } from "@/api";

export function renderAvatar(user: User | Friend, avatarElement: HTMLElement | null) {
	// **Actualizar imagen**
  if (avatarElement instanceof HTMLImageElement) {
	avatarElement.src = user.avatar && user.avatar.trim() !== "" 
	  ? `${API_BASE_URL}${user.avatar}` 
	  // 👆 Aquí `user.avatarUrl` debe ser la URL que te devuelve tu backend.
	  : "/images/avatar1.jpg"; // Imagen por defecto
  }
}