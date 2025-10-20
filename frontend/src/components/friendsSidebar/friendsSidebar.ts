import { updateTexts } from "@/app/i18n";
import { addFriend, deleteFriend } from "@/modules/social/friendsManager";
import { getCurrentUser } from "@/modules/users";
import type { User } from "@/types/user";
import { getReadySocialSocket } from "@/modules/social/socketUtils";

export async function initFriendsSidebar(user?: User) {
  // 1. Si no recibo un user se lo solicito a getCurrentUser()
  if (!user) {
    const userResponse = await getCurrentUser();
    if (!userResponse) return;
    user = userResponse.user;
  }

  const container = document.getElementById("friends-sidebar-container");
  if (!container) return console.warn("⚠️ No se encontró #friends-sidebar-container");

  // 🔹 Cargar el HTML del componente
  const response = await fetch("/src/components/friendsSidebar/friendsSidebar.html");
  const html = await response.text();
  container.innerHTML = html;

  // 🔹 Esperar un pequeño tick para que el DOM se renderice
  await new Promise((r) => requestAnimationFrame(r));

  // 🔹 Obtener referencias del DOM
  const toggleBtn = document.getElementById("friends-toggle-btn")!;
  const panel = document.getElementById("friends-panel")!;
  const friendInput = document.getElementById("friend-input") as HTMLInputElement;
  const addFriendBtn = document.getElementById("add-friend-btn")!;
  const onlineList = document.getElementById("online-friends")!;
  const offlineList = document.getElementById("offline-friends")!;
  const deleteFriendInput = document.getElementById("delete-friend-input") as HTMLInputElement;
  const deleteFriendBtn = document.getElementById("delete-friend-btn")!;

  // 🔹 Función para renderizar listas de amigos
  function renderLists(friends: { username: string; is_connected: boolean }[]) {
    const onlineFriends = friends.filter(f => f.is_connected).map(f => f.username);
    const offlineFriends = friends.filter(f => !f.is_connected).map(f => f.username);

    onlineList.innerHTML = onlineFriends
      .map(name => `<li class="flex justify-between items-center bg-white/20 rounded-md px-3 py-2"><span>${name}</span></li>`)
      .join("");

    offlineList.innerHTML = offlineFriends
      .map(name => `<li class="flex justify-between items-center bg-white/10 rounded-md px-3 py-2"><span>${name}</span></li>`)
      .join("");
  }

  // 🔹 Conectar al WebSocket singleton y suscribirse a actualizaciones
  const ws = await getReadySocialSocket(); // espera a que el WS esté listo
  ws.onFriendsUpdate((friends) => {
    renderLists(friends);
  });
  // NO llamamos ws.refreshFriendsList() porque ya se actualiza al autenticarse
  ws.refreshFriendsList();

  // 🔹 Mostrar / ocultar panel
  toggleBtn.addEventListener("click", () => {
    const isOpen = panel.classList.contains("translate-x-0");
    panel.classList.toggle("translate-x-0", !isOpen);
    panel.classList.toggle("-translate-x-full", isOpen);
  });

  // 🔹 Agregar amigo
  addFriendBtn.addEventListener("click", async () => {
    const response = await addFriend(user, friendInput.value);
    if (response)
      friendInput.value = "";
      ws?.refreshFriendsList();
  });

  // 🔹 Eliminar amigo
  deleteFriendBtn.addEventListener("click", async () => {
    const response = await deleteFriend(deleteFriendInput.value);
    if (response) {
      deleteFriendInput.value = "";
      ws?.refreshFriendsList();
    }
  });

  // 🔹 Invitar a jugar
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains("invite-btn")) {
      const name = target.dataset.name!;
      alert(`Invitación enviada a ${name}`);
    }
  });

  updateTexts();
}
