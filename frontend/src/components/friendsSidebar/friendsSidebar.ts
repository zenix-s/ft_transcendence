import { t, updateTexts } from '@/app/i18n';
import { addFriend, deleteFriend } from '@/modules/social/friendsManager';
import type { Friend } from '@/types/friend';
import { getReadySocialSocket } from '@/modules/social/socketUtils';
import { renderAvatar } from '../renderAvatar';
import { showToast } from '../toast';
import { fetchGameId } from '@/modules/game/getData';
import { apiUrl } from '@/api';
import { modal } from '../modal';
import type { GameOptions } from '@/types/gameOptions';
import { createGameSocket } from '@/modules/game/gameSocket';

export async function initFriendsSidebar() {
    const container = document.getElementById('friends-sidebar-container');
    if (!container)
        return console.warn('⚠️ No se encontró #friends-sidebar-container');

    // 🔹 Cargar el HTML del componente
    const response = await fetch(
        '/src/components/friendsSidebar/friendsSidebar.html'
    );
    const html = await response.text();
    container.innerHTML = html;

    // 🔹 Esperar un pequeño tick para que el DOM se renderice
    await new Promise((r) => requestAnimationFrame(r));

    // 🔹 Obtener referencias del DOM
    const toggleBtn = document.getElementById('friends-toggle-btn')!;
    const panel = document.getElementById('friends-panel')!;
    const addFriendForm = document.getElementById(
        'add-friend-form'
    ) as HTMLElement;
    const friendInput = document.getElementById(
        'friend-input'
    ) as HTMLInputElement;
    //const addFriendBtn = document.getElementById("add-friend-btn")!;
    const onlineList = document.getElementById('online-friends')!;
    const offlineList = document.getElementById('offline-friends')!;
    const deleteFriendForm = document.getElementById(
        'delete-friend-form'
    ) as HTMLElement;
    const deleteFriendInput = document.getElementById(
        'delete-friend-input'
    ) as HTMLInputElement;
    //const deleteFriendBtn = document.getElementById("delete-friend-btn")!;

    function renderLists(friends: Friend[]) {
        const render = (
            listEl: HTMLElement,
            items: Friend[],
            emptyText: string
        ) => {
            listEl.innerHTML = ''; // limpiar lista

            if (items.length === 0) {
                const emptyItem = document.createElement('li');
                emptyItem.className = 'text-white/70 italic text-sm px-3 py-2';
                emptyItem.textContent = t(emptyText);
                emptyItem.dataset.i18n = emptyText;
                listEl.appendChild(emptyItem);
                return;
            }

            for (const friend of items) {
                const li = document.createElement('li');
                li.className = friend.is_connected
                    ? 'flex items-center gap-3 rounded-md px-3 py-2 bg-white/30 hover:bg-white/40 transition-all duration-300 ease-in-out'
                    : 'flex items-center gap-3 rounded-md px-3 py-2 bg-white/10 hover:bg-white/20 text-gray-500 transition-all duration-300 ease-in-out';

                const img = document.createElement('img');
                img.alt = `${friend.username} avatar`;
                img.className =
                    'w-8 h-8 rounded-full object-cover border border-primary';
                img.loading = 'lazy';

                renderAvatar(friend, img);

                const span = document.createElement('span');
                span.textContent = friend.username;

                const inviteBtn = document.createElement('button');
                inviteBtn.className =
                    'bg-white text-cyan-700 hover:bg-cyan-700 hover:text-white px-2 py-1 rounded transition-all duration-300 ease-in-out ml-auto invite-btn';
                inviteBtn.textContent = t('InviteToGame');
                inviteBtn.dataset.i18n = 'InviteToGame';
                inviteBtn.dataset.name = friend.username;

                li.appendChild(img);
                li.appendChild(span);
                if (friend.is_connected) {
                    li.appendChild(inviteBtn);
                }
                listEl.appendChild(li);
            }
        };

        const online = friends.filter((friend) => friend.is_connected);
        const offline = friends.filter((friend) => !friend.is_connected);

        render(onlineList, online, 'NoFriendsOnline');
        render(offlineList, offline, 'NoFriendsOffline');
    }

    // 🔹 Conectar al WebSocket singleton y suscribirse a actualizaciones
    const ws = await getReadySocialSocket(); // espera a que el WS esté listo

    if (!ws) {
        console.warn('⚠️ WebSocket Social no disponible');
        return;
    }

    // 🔹 Suscribirse a actualizacione
    ws.onFriendsUpdate((friends) => {
        renderLists(friends);
    });

    // Render inicial de la lista directamente desde el estado actual
    ws.refreshFriendsList();
    //renderLists(ws.getFriends()); // Otra opción para lo mismo

    // 🔹 Mostrar / ocultar panel
    toggleBtn.addEventListener('click', () => {
        const isOpen = panel.classList.contains('translate-x-0');
        panel.classList.toggle('translate-x-0', !isOpen);
        panel.classList.toggle('-translate-x-full', isOpen);
    });

    // 🔹 Agregar amigo
    addFriendForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // evita recarga
        const response = await addFriend(friendInput.value);
        if (response) friendInput.value = '';
        ws?.refreshFriendsList();
    });

    // 🔹 Eliminar amigo
    deleteFriendForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // evita recarga
        const response = await deleteFriend(deleteFriendInput.value);
        if (response) {
            deleteFriendInput.value = '';
            ws?.refreshFriendsList();
        }
    });

    // 🔹 Invitar a jugar
    const inviteBtn = document.getElementById('online-friends') as HTMLElement;
    inviteBtn?.addEventListener('click', async (event) => {
        event.preventDefault();
        const target = event.target as HTMLElement;
        if (target.classList.contains('invite-btn')) {
            const username = target.dataset.name;
            //const gameId = await fetchGameId(); // Create game PONG --> Y si hay otro juego?
            // Hay que enviar la invitación y poder elegir el juego
            const confirmed: true | false | GameOptions = await modal({
                type: 'gameCreation',
            });
            if (confirmed && typeof confirmed !== 'boolean') {
                // Crear el juego con las opciones seleccionadas
                const createResult = await fetchGameId(
                    confirmed.maxPoints,
                    confirmed.maxTime,
                    confirmed.gameMode
                ); // Create game PONG --> Y si hay otro juego?
                if (!createResult.isSuccess || !createResult.gameId) {
                    showToast(t(createResult.error || 'NoGameId'), 'error');
                    return;
                }

                // Conectarse al juego vía WebSocket
                const token = localStorage.getItem('access_token');
                const ws = createGameSocket(token, createResult.gameId!);
                ws.authenticate(createResult.gameId);

                // Se espera a la conexión
                let connected: boolean = false;
                let retries: number = 0;
                const maxRetries: number = 5;
                while (!connected && retries < maxRetries) {
                    connected = ws.isConnected();
                    if (!connected) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 500)
                        );
                        retries++;
                    }
                }

                if (!connected) {
                    // TODO: añadir traducción GameServerConnectionFailed
                    showToast(t('GameServerConnectionFailed'), 'error');
                    return;
                }

                // Enviar la invitación
                const inviteResult = await inviteMultiplayer(
                    username,
                    createResult.gameId
                );
                if (!inviteResult.isSucces) {
                    ws.leaveGame();
                    showToast(
                        t(inviteResult.error || 'InvitationFailed'),
                        'error'
                    ); // TODO: añadir error InvitationFailed
                    return;
                }

                showToast(t('InvitationSentSuccessfully'), 'success');
            }
        }
    });

    updateTexts();
}

// Function to invite a friend to play multiplayer game
export async function inviteMultiplayer(
    username: string | undefined,
    gameId: number,
    message: string = 'te invita a jugar a Pong'
): Promise<{ isSucces: boolean; error?: string }> {
    try {
        const response = await fetch(
            apiUrl(`/game-invitation/send-invitation`),
            {
                method: 'POST',
                body: JSON.stringify({
                    username: username,
                    gameId: gameId,
                    message: message,
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            const errorcode = data.error || 'UserNotFound';
            // if (errorcode === 'InvalidRequestData')
            //     showToast(t('AlreadyInvitationInProgress'), 'error');
            // else showToast(t(errorcode), 'error');
            return { isSucces: false, error: errorcode };
        }

        // showToast(t('InvitationSentSuccessfully'));
        // return true;
        return { isSucces: true };
    } catch {
        // showToast(t('NetworkOrServerError'), 'error');
        return { isSucces: false, error: 'NetworkOrServerError' };
    }
}

export async function acceptInvitation(gameId: number): Promise<boolean> {
    try {
        const response = await fetch(
            apiUrl(`/game-invitation/accept-invitation`),
            {
                method: 'POST',
                body: JSON.stringify({ gameId: gameId }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            const errorcode = data.error || 'UserNotFound';
            showToast(t(errorcode), 'error');
            return false;
        }

        showToast(t('InvitationAcceptedSuccessfully'));
        return true;
    } catch {
        showToast(t('NetworkOrServerError'), 'error');
        return false;
    }
}

export async function rejectInvitation(gameId: number): Promise<boolean> {
    try {
        const response = await fetch(
            apiUrl(`/game-invitation/reject-invitation`),
            {
                method: 'POST',
                body: JSON.stringify({ gameId: gameId }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            const errorcode = data.error || 'UserNotFound';
            showToast(t(errorcode), 'error');
            return false;
        }

        return true;
    } catch {
        showToast(t('NetworkOrServerError'), 'error');
        return false;
    }
}
