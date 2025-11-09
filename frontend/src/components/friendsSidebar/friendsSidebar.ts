import { t, updateTexts } from "@/app/i18n";
import { addFriend, deleteFriend } from "@/modules/social/friendsManager";
import type { Friend } from "@/types/friend";
import { getReadySocialSocket } from "@/modules/social/socketUtils";
import { renderAvatar } from "../renderAvatar";
import { showToast } from "../toast";
import { fetchGameId } from "@/modules/game/getData";
import { apiUrl } from "@/api";
import { navigateTo } from "@/app/navigation";

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

        const inviteBtn = document.createElement("button");
        inviteBtn.className = "bg-white text-cyan-700 hover:bg-cyan-700 hover:text-white px-2 py-1 rounded transition-all duration-300 ease-in-out ml-auto invite-btn";
        inviteBtn.textContent = t("InviteToGame");
        inviteBtn.dataset.i18n = "InviteToGame";
        inviteBtn.dataset.name = friend.username;

        li.appendChild(img);
        li.appendChild(span);
        if (friend.is_connected) {
          li.appendChild(inviteBtn);
        }
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
  ws?.onFriendsUpdate((friends) => {
    renderLists(friends);
  });

  // Render inicial de la lista directamente desde el estado actual
  ws?.refreshFriendsList();
  //renderLists(ws.getFriends()); // Otra opción para lo mismo

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
  const inviteBtn = document.getElementById("online-friends") as HTMLElement;
  inviteBtn?.addEventListener("click", async (event) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    if (target.classList.contains("invite-btn")) {
      const username = target.dataset.name;
      const gameId = await fetchGameId(); // Create game PONG --> Y si hay otro juego?
      // Hay que enviar la invitación y poder elegir el juego
      inviteMultiplayer(username, gameId);
      navigateTo(`playing?id=${gameId}&mutiPlayer`); // Temporal para pruebas?
      //showToast("Invitando a: " + username, "success");
    }
  });

  updateTexts();
}

// Function to invite a friend to play multiplayer game
export async function inviteMultiplayer(username: string | undefined, gameId: number, message: string = "te invita a jugar a Pong") {
  try {
    const response = await fetch(apiUrl(`/game-invitation/send-invitation`), {
      method: "POST",
      body: JSON.stringify({
        username: username,
        gameId: gameId,
        message: message
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    const data = await response.json();

		if (!response.ok) {
			const errorcode = data.error || "UserNotFound";
      if (errorcode === "InvalidRequestData")
			  showToast(t("AlreadyInvitationInProgress"), "error");
      else
			  showToast(t(errorcode), "error");
			return false;
		}

		showToast(t("InvitationSentSuccessfully"));
		return true;

  } catch {
    showToast(t("NetworkOrServerError"), "error");
		return false;
  }
}

export async function acceptInvitation(gameId: number): Promise<boolean> {
  try {
    const response = await fetch(apiUrl(`/game-invitation/accept-invitation`), {
      method: "POST",
      body: JSON.stringify({ gameId: gameId }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    const data = await response.json();

		if (!response.ok) {
			const errorcode = data.error || "UserNotFound";
			showToast(t(errorcode), "error");
			return false;
		}

		showToast(t("InvitationAcceptedSuccessfully"));
		return true;

  } catch {
    showToast(t("NetworkOrServerError"), "error");
		return false;
  }
}