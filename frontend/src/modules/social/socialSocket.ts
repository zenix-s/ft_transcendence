import { getWsUrl } from "@/api";
import { showToast } from "@/components/toast";
import type { Friend } from "@/types/friend"

interface AuthSuccessMessage {
  type: "authSuccess";
  userId: number;
}

interface FriendsListMessage {
  type: "friendsList";
  friends: Friend[];
}

interface FriendConnectionStatusMessage {
  type: "friendConnectionStatus";
  friendId: number;
  username: string;
  isConnected: boolean;
}

export class SocialWebSocketClient {
  private socket: WebSocket | null = null;
  private token: string;
  private wsUrl: string;
  private isAuthenticated = false;
  private friends: Friend[] = [];

  constructor(token: string) {
    this.wsUrl = getWsUrl("/social/");
    this.token = token;
  }

  connect() {
    console.log("🔌 Conectando a WebSocket...");
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      console.log("🟢 WebSocket conectado");
      this.authenticate();
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (err) {
        console.error("❌ Error parseando mensaje:", err);
      }
    };

    this.socket.onclose = () => {
      console.log("🔴 WebSocket cerrado");
      this.isAuthenticated = false;
    };

    this.socket.onerror = (err) => {
      console.error("⚠️ Error WebSocket:", err);
    };
  }

  private authenticate() {
    const msg = { action: 0, token: this.token };
    this.send(msg);
  }

  public requestFriendsList() {
    if (!this.isAuthenticated) {
      console.error("❌ No autenticado todavía");
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket no está abierto todavía");
      return;
    }

    const msg = { action: 1 };
    console.log("📋 Solicitando lista de amigos...");
    this.send(msg);
  }

  public refreshFriendsList() {
    this.requestFriendsList();
  }

  private send(obj: unknown) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(obj));
    } else {
      console.warn("⚠️ WebSocket no está listo todavía");
    }
  }

  private disconnectTimers: Map<number, NodeJS.Timeout> = new Map();

  private handleMessage(message: unknown) {
    // Detectar tipo
    const type = (message as { type?: unknown})?.type;

    switch (type) {
      case "authSuccess": {
        const msg = message as AuthSuccessMessage;
        this.isAuthenticated = true;
        console.log("✅ Autenticado correctamente:", msg.userId);
        // Mejor sólo devolver lista cuando la página lo solicite????
        setTimeout(() => this.requestFriendsList(), 100);
        break;
      }

      case "friendsList": {
        const msg = message as FriendsListMessage;
        this.friends = msg.friends;
        console.log("👥 Lista de amigos recibida:", this.friends);
        if (this.onFriendsUpdateCallback)
          this.onFriendsUpdateCallback([...this.friends]);
        break;
      }

      case "friendConnectionStatus": {
        const msg = message as FriendConnectionStatusMessage;
        const friend = this.friends.find(f => f.id === msg.friendId);

        if (!friend) return;

        const timeDelay: number = 3000; // 3 seconds

        // ⚡ DESCONEXIÓN
        if (!msg.isConnected) {
          // Cancelamos cualquier timer previo
          const prevTimer = this.disconnectTimers.get(msg.friendId);
          if (prevTimer) clearTimeout(prevTimer);

          // Programamos desconexión real en 3s
          const timer = setTimeout(() => {
            friend.is_connected = false;
            console.log(`🔄 ${msg.username} está ahora 🔴 desconectado`);
            showToast(`🔄 ${msg.username} está ahora 🔴 desconectado`, "success");
            if (this.onFriendsUpdateCallback) {
              this.onFriendsUpdateCallback([...this.friends]);
            }
            this.disconnectTimers.delete(msg.friendId);
          }, timeDelay);

          this.disconnectTimers.set(msg.friendId, timer);
          return; // ignoramos el toast inmediato
        }

        // ⚡ CONEXIÓN
        if (msg.isConnected) {
          // Si había un timer de desconexión pendiente → cancelamos
          const timer = this.disconnectTimers.get(msg.friendId);
          if (timer) {
            clearTimeout(timer);
            this.disconnectTimers.delete(msg.friendId);
            // Es recarga → no mostramos nada
          } else {
            // Conexión real → mostramos toast inmediatamente
            friend.is_connected = true;
            console.log(`🔄 ${msg.username} está ahora 🟢 conectado`);
            showToast(`🔄 ${msg.username} está ahora 🟢 conectado`, "success");
            if (this.onFriendsUpdateCallback) {
              this.onFriendsUpdateCallback([...this.friends]);
            }
          }
        }

        break;
      }

      default:
        console.log("📨 Mensaje recibido (desconocido):", message);
    }
  }

  private onFriendsUpdateCallback: ((friends: Friend[]) => void) | null = null;

  public onFriendsUpdate(callback: (friends: Friend[]) => void) {
    //if (this.onFriendsUpdateCallback) return; // Ignorar si ya hay uno
    this.onFriendsUpdateCallback = callback;
    // Para que el sidebar pinte algo inmediatamente al llamar onFriendsUpdate()
    if (this.friends.length > 0) {
      callback([...this.friends]);
    }
  }

  // Para acceder a la lista cacheada
  public getFriends() {
    return [...this.friends];
  }

  // Para saber si alguien está o no autenticado
  public getAuthenticated() {
    return this.isAuthenticated;
  }

  disconnect() {
    if (this.socket) {
      console.log("👋 Cerrando conexión WebSocket...");
      this.socket.close();
    }
  }
}