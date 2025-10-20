export class SocialWebSocketClient {
  private socket: WebSocket | null = null;
  private token: string;
  private wsUrl: string;
  private isAuthenticated = false;
  private friends: any[] = [];

  constructor(token: string) {
    this.wsUrl = "wss://localhost:3000/social/"; // ajusta si cambia el puerto
    this.token = token;
  }

  connect() {
    console.log("🔌 Conectando a WebSocket...");
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      console.log("🟢 WebSocket conectado");
      this.authenticate();
    };

    this.socket.onmessage = (event) => {
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

  private send(obj: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(obj));
    } else {
      console.warn("⚠️ WebSocket no está listo todavía");
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "authSuccess":
        this.isAuthenticated = true;
        console.log("✅ Autenticado correctamente:", message.userId);
        // Mejor sólo devolver lista cuando la página lo solicite????
        // setTimeout(() => this.requestFriendsList(), 100);
        break;

      case "friendsList":
        this.friends = message.friends;
        console.log("👥 Lista de amigos recibida:", this.friends);
        if (this.onFriendsUpdateCallback)
          this.onFriendsUpdateCallback(this.friends);
        break;

      case "friendConnectionStatus":
        const friend = this.friends.find(f => f.id === message.friendId);
        if (friend) friend.is_connected = message.isConnected;
        console.log(
          `🔄 ${message.username} está ahora ${message.isConnected ? "🟢 conectado" : "🔴 desconectado"}`
        );
        break;

      default:
        console.log("📨 Mensaje recibido:", message);
    }
  }

  private onFriendsUpdateCallback: ((friends: any[]) => void) | null = null;

  public onFriendsUpdate(callback: (friends: any[]) => void) {
    if (this.onFriendsUpdateCallback) return; // Ignorar si ya hay uno
    this.onFriendsUpdateCallback = callback;
  }

  disconnect() {
    if (this.socket) {
      console.log("👋 Cerrando conexión WebSocket...");
      this.socket.close();
    }
  }
}