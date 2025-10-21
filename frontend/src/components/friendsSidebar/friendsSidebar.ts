import { t, updateTexts } from "@/app/i18n";
import { addFriend, deleteFriend } from "@/modules/social/friendsManager";
import type { Friend } from "@/types/friend";
import { getReadySocialSocket } from "@/modules/social/socketUtils";
import { renderAvatar } from "../renderAvatar";

export async function initFriendsSidebar() {
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
  const addFriendForm = document.getElementById("add-friend-form") as HTMLElement;
  const friendInput = document.getElementById("friend-input") as HTMLInputElement;
  //const addFriendBtn = document.getElementById("add-friend-btn")!;
  const onlineList = document.getElementById("online-friends")!;
  const offlineList = document.getElementById("offline-friends")!;
  const deleteFriendForm  = document.getElementById("delete-friend-form") as HTMLElement;
  const deleteFriendInput = document.getElementById("delete-friend-input") as HTMLInputElement;
  //const deleteFriendBtn = document.getElementById("delete-friend-btn")!;

  function renderLists(friends: Friend[]) {
    const render = (listEl: HTMLElement, items: Friend[], emptyText: string) => {
      listEl.innerHTML = ""; // limpiar lista

      if (items.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "text-white/70 italic text-sm px-3 py-2";
        emptyItem.textContent = t(emptyText);
        emptyItem.dataset.i18n = emptyText;
        listEl.appendChild(emptyItem);
        return;
      }

      for (const friend of items) {
        const li = document.createElement("li");
        li.className = friend.is_connected
          ? "flex items-center gap-3 rounded-md px-3 py-2 bg-white/30 hover:bg-white/40 transition-all duration-300 ease-in-out"
          : "flex items-center gap-3 rounded-md px-3 py-2 bg-white/10 hover:bg-white/20 text-gray-500 transition-all duration-300 ease-in-out";

        const img = document.createElement("img");
        img.alt = `${friend.username} avatar`;
        img.className = "w-8 h-8 rounded-full object-cover border border-primary";
        img.loading = "lazy";

        renderAvatar(friend, img);

        const span = document.createElement("span");
        span.textContent = friend.username;

        li.appendChild(img);
        li.appendChild(span);
        listEl.appendChild(li);
      }
    };

    const online = friends.filter(friend => friend.is_connected);
    const offline = friends.filter(friend => !friend.is_connected);

    render(onlineList, online, "NoFriendsOnline");
    render(offlineList, offline, "NoFriendsOffline");
  }

  // 🔹 Conectar al WebSocket singleton y suscribirse a actualizaciones
  const ws = await getReadySocialSocket(); // espera a que el WS esté listo
  ws.onFriendsUpdate((friends) => {
    renderLists(friends);
  });
  // NO llamamos ws.refreshFriendsList() porque ya se actualiza al autenticarse
  //ws.refreshFriendsList();

  // 🔹 Mostrar / ocultar panel
  toggleBtn.addEventListener("click", () => {
    const isOpen = panel.classList.contains("translate-x-0");
    panel.classList.toggle("translate-x-0", !isOpen);
    panel.classList.toggle("-translate-x-full", isOpen);
  });

  // 🔹 Agregar amigo
  addFriendForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // evita recarga
    const response = await addFriend(friendInput.value);
    if (response)
      friendInput.value = "";
      ws?.refreshFriendsList();
  });

  // 🔹 Eliminar amigo
  deleteFriendForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // evita recarga
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
