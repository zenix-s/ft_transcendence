import { getWsUrl } from "@/api";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { acceptInvitation } from "@/components/friendsSidebar/friendsSidebar";
import { modal } from "@/components/modal";
import { showToast } from "@/components/toast";
import type { Friend } from "@/types/friend"
import { reloadGameHistory } from "@/app/main";
import { createGameSocket, getGameSocket } from "../game/gameSocket";

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

interface GameInvitationResponse {
    type: 'gameInvitation';
    fromUserId: number;
    fromUsername: string;
    fromUserAvatar: string | null;
    gameId: number;
    gameTypeName: string;
    message: string;
}

interface gameInvitationAcceptance {
  type: "gameInvitationAcceptance";
	success: boolean;
	fromUserId: number;
	fromUsername: string;
	fromUserAvatar: string | null;
	gameId: number;
	gameTypeName: string;
	message: string;
}

export class SocialWebSocketClient {
  private socket: WebSocket | null = null;
  private token: string;
  private wsUrl: string;
  private isAuthenticated = false;
  private friends: Friend[] = [];
  private gameMode?: string;

  constructor(token: string) {
    this.wsUrl = getWsUrl("/social/");
    this.token = token;
  }

  connect() {
    console.log("🔌", t("ConnectingToWs"));
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      console.log("🟢", t("WsConnected"));
      this.authenticate();
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const message = JSON.parse(event.data);
        console.log("msgttt=", message);
        this.handleMessage(message);
      } catch (err) {
        console.error(`❌ ${t("ErrorParsingMsg")}`, err);
      }
    };

    this.socket.onclose = () => {
      console.log("🔴", t("WsClosed"));
      this.isAuthenticated = false;
    };

    this.socket.onerror = (err) => {
      console.error(`⚠️ ${t("WsError")}`, err);
    };
  }

  private authenticate() {
    const msg = { action: 0, token: this.token };
    this.send(msg);
  }

  public requestFriendsList() {
    if (!this.isAuthenticated) {
      console.error("❌", t("NotAuthenticated"));
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("⚠️", t("WsNotOpen"));
      return;
    }

    const msg = { action: 1 };
    console.log("📋", t("RequestFriends"));
    this.send(msg);
  }

  public refreshFriendsList() {
    this.requestFriendsList();
  }

  private send(obj: unknown) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(obj));
    } else {
      console.warn("⚠️", t("WsNotReady"));
    }
  }

  private disconnectTimers: Map<number, NodeJS.Timeout> = new Map();

  private async handleMessage(message: unknown) {
    // Detectar tipo
    const type = (message as { type?: unknown})?.type;

    switch (type) {
      case "authSuccess": {
        const msg = message as AuthSuccessMessage;
        this.isAuthenticated = true;
        console.log(`✅ ${t("SuccessAuthenticated")}`, msg.userId);
        // Mejor sólo devolver lista cuando la página lo solicite????
        setTimeout(() => this.requestFriendsList(), 100);
        break;
      }

      case "friendsList": {
        const msg = message as FriendsListMessage;
        this.friends = msg.friends;
        console.log(`👥 ${t("FriendListReceived")}`, this.friends);
        if (this.onFriendsUpdateCallback)
          this.onFriendsUpdateCallback([...this.friends]);
        break;
      }

      case "gameInvitation": {
        const msg = message as GameInvitationResponse;
        console.log(`${msg.fromUsername} con id ${msg.fromUserId} te ha invitado a jugar a PONG con el número de partida ${msg.gameId} y el mensaje: ${msg.message}`);
        const confirmed = await modal({
          type: "gameInvitation",
          winner: msg.fromUsername,
          gameName: msg.gameTypeName});
        if (confirmed)
        {
          // Definir que pasa si se ACEPTA la invitación
          console.log("Has aceptado la invitación");
          const response = await acceptInvitation(msg.gameId);

          const token = localStorage.getItem("access_token");
          createGameSocket(token, msg.gameId);

          const playerView = "3D";
          if (response)
            navigateTo(`playing?id=${msg.gameId}&mutiPlayer&view=${playerView}`); // Enviar a la partida
        }
        console.log("he rechazado la invitación");
        // Definir que pasa si RECHAZA la invitación
        break;
      }

      case "gameInvitationAcceptance": {
        const msg = message as gameInvitationAcceptance;
        let mode = "2D";
        navigateTo(`playing?id=${msg.gameId}&mutiPlayer&view=${mode}`); // Temporal para pruebas?
        showToast("Aceptada la invitación por: " + msg.fromUsername, "success");
        break ;
      }

      case "gameInvitationRejection": {
        const ws = getGameSocket();
        if (ws)
          ws.invitationRejected();
        break ;
      }

      case "friendProfileUpdate": {
        console.log("Friend profile update detected");
        this.requestFriendsList();

        // Reload History
        reloadGameHistory(this.token);

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
            console.log(`🔄 ${msg.username} ${t("IsNow")} 🔴 ${t("Offline")}`);
            showToast(`🔄 ${msg.username} ${t("IsNow")} 🔴 ${t("Offline")}`, "success");
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
            console.log(`🔄 ${msg.username} ${t("IsNow")} 🟢 ${t("Online")}`);
            showToast(`🔄 ${msg.username} ${t("IsNow")} 🟢 ${t("Online")}`, "success");
            if (this.onFriendsUpdateCallback) {
              this.onFriendsUpdateCallback([...this.friends]);
            }
          }
        }

        break;
      }

      default:
        console.log(`📨 ${t("MsgReceived")}`, message);
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
      console.log(`👋 ${t("ClosingWs")}`);
      this.socket.close();
    }
  }
}