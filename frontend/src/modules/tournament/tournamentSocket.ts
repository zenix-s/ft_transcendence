import { getWsUrl } from "@/api";
import { t } from "@/app/i18n";
import { showToast } from "@/components/toast";
import { refreshTournamentsHistory } from "@/components/tournamentsHistory";

// TODO: Ajustar cuando el backend esté definido
interface payload {
  winnerId?: number;
  loserId?: number;
  message: string;
}

interface AuthSuccessMessage {
  action: "authSuccess";
  userId: number;
}

interface ErrorMessage {
  action: "error";
  message: string;
}

interface tournamentStartedMessage {
  action: "tournamentStarted";
  tournamentId: number;
  payload: payload;
}

interface tournamentEndedMessage {
  action: "tournamentEnded";
  tournamentId: number;
  payload: payload;
}

interface tournamentStateUpdatedMessage {
  action: "tournamentStateUpdated";
  tournamentId: number;
  payload: payload;
}

interface newRoundStartedMessage {
  action: "newRoundStarted";
  tournamentId: number;
  roundNumber: number;
  payload: payload;
}

interface matchCreatedMessage {
  action: "matchCreated";
  tournamentId: number;
  matchId: number;
  opponentId: number | null;
  isAgainstAI: boolean;
  roundNumber: number;
  payload: payload;
}

interface matchResultMessage {
  action: "matchResult";
  tournamentId: number;
  matchId: number;
  roundNumber: number;
  payload: payload;
}

interface tournamentWonMessage {
  action: "tournamentWon";
  tournamentId: number;
  userId: number;
  payload: payload;
}

/* interface TournamentListMessage {
  type: "tournamentList";
  tournaments: Tournament[]; // Reemplazar con interfaz real
}

interface TournamentCreatedMessage {
  type: "tournamentCreated";
  tournamentId: number;
  name: string;
} */

interface Tournament {
  id: number;
  name?: string;
  // otras propiedades del torneo
  [key: string]: unknown;
}

interface TournamentUpdatedMessage {
  type: "tournamentUpdated";
  tournamentId: number;
  data: Partial<Tournament>; // Detalles que quiera enviar el backend
}

export class TournamentWebSocketClient {
  private socket: WebSocket | null = null;
  private token: string;
  private wsUrl: string;
  private isAuthenticated = false;
  private tournaments: Tournament[] = [];

  constructor(token: string) {
    this.wsUrl = getWsUrl("/tournaments/pong/"); // Actualizar al EndPoint correspondiente a los torneos
    this.token = token;
  }

  connect() {
    console.log("🔌 [Tournaments]", t("ConnectingToWs"));
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      console.log("🟢 [Tournaments]", t("WsConnected"));
      this.authenticate();
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (err) {
        console.error(`❌ [Tournaments] ${t("ErrorParsingMsg")}`, err);
      }
    };

    this.socket.onclose = () => {
      console.log("🔴 [Tournaments]", t("WsClosed"));
      this.isAuthenticated = false;
    };

    this.socket.onerror = (err) => {
      console.error(`⚠️ [Tournaments] ${t("WsError")}`, err);
    };
  }

  private authenticate() {
    //const msg = { action: 0, token: this.token };
    const msg = { token: this.token };
    this.send(msg);
  }

  private send(obj: unknown) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(obj));
    } else {
      console.warn("⚠️ [Tournaments]", t("WsNotReady"));
    }
  }

  private async handleMessage(message: unknown) {
    // Detectar tipo
    const action = (message as { action?: unknown})?.action;

    switch (action) {
      case "authSuccess": {
        const msg = message as AuthSuccessMessage;
        this.isAuthenticated = true;
        console.log(`✅ [Tournaments] ${t("SuccessAuthenticated")}`, msg.userId);
        break;
      }

      case "error": {
        const msg = message as ErrorMessage;
        console.error(`❌ [Tournaments] ${t("ErrorFromServer")}:`, msg.message);
        showToast(`${t("ErrorFromServer")}: ${msg.message}`, "error");
        break;
      }

      case "tournamentStarted": {
        const msg = message as tournamentStartedMessage;
        console.log(`🏆 [Tournaments] ${t("TournamentStarted")}`, msg.tournamentId);
        showToast(`${t("TournamentStarted")}: ${msg.tournamentId}`, "success");
        break;
      }

      case "tournamentEnded": {
        const msg = message as tournamentEndedMessage;
        console.log(`🏆 [Tournaments] ${t("TournamentEnded")}`, msg.tournamentId);
        showToast(`${t("TournamentEnded")}: ${msg.tournamentId}`, "success");
        break;
      }

      case "tournamentStateUpdated": {
        const msg = message as tournamentStateUpdatedMessage;
        console.log(`🔄 [Tournaments] ${t("TournamentStateUpdated")}`, msg.tournamentId);
        refreshTournamentsHistory(); // Actualizar la historia de torneos
        break;
      }

      case "newRoundStarted": {
        const msg = message as newRoundStartedMessage;
        console.log(`🔔 [Tournaments] ${t("NewRoundStarted")}`, msg.roundNumber);
        showToast(`${t("NewRoundStarted")}: ${msg.roundNumber}`, "success");
        break;
      }

      case "matchCreated": {
        const msg = message as matchCreatedMessage;
        console.log(`🎮 [Tournaments] ${t("MatchCreated")}`, msg.matchId);
        showToast(`${t("MatchCreated")}: ${msg.matchId}`, "success");
        break;
      }

      case "matchResult": {
        const msg = message as matchResultMessage;
        console.log(`📊 [Tournaments] ${t("MatchResult")}`, msg.matchId);
        showToast(`${t("MatchResult")}: ${msg.matchId}`, "success");
        break;
      }

      case "tournamentWon": {
        const msg = message as tournamentWonMessage;
        console.log(`🏅 [Tournaments] ${t("TournamentWon")}`, msg.tournamentId);
        showToast(`${t("TournamentWon")}: ${msg.tournamentId}`, "success");
        break;
      }

      /* case "tournamentList": {
        const msg = message as TournamentListMessage;
        this.tournaments  = msg.tournaments;
        console.log("📋 [Tournaments] List received", this.tournaments); // Translation i18n needed
        this.notifyTournamentUpdate();
        break;
      }

      case "tournamentCreated": {
        const msg = message as TournamentCreatedMessage;
        console.log("🏆 [Tournaments] New tournament", msg); // Translation i18n needed

        showToast(`🏆 Nuevo torneo creado: ${msg.name}`, "success"); // Translation i18n needed


        this.tournaments.push({
          id: msg.tournamentId,
          name: msg.name,
        });

        this.notifyTournamentUpdate();

        break;
      }

      case "tournamentUpdated": {
        const msg = message as TournamentUpdatedMessage;

        console.log("🔄 [Tournaments] Update", msg); // Translation i18n needed

        // Buscar y actualizar
        const index = this.tournaments.findIndex(
          (t: Tournament) => t.id === msg.tournamentId
        );

        if (index !== -1) {
          this.tournaments[index] = {
            ...this.tournaments[index],
            ...msg.data,
          };
        }

        this.notifyTournamentUpdate();
        break;
      } */

      default:
        console.log(`📨 [Tournaments] ${t("MsgReceived")}`, message);
    }
  }

  /* public requestTournamentList() {
    if (!this.isAuthenticated) {
      console.error("❌ [Tournaments] Not authenticated"); // Translation i18n needed
      return;
    }
    this.send({ action: 1 });
  } */

  // 🔔 Callbacks para frontend
  /* private onTournamentUpdateCallback: ((tournaments: unknown[]) => void) | null = null;

  public onTournamentUpdate(callback: (tournaments: unknown[]) => void) {
    this.onTournamentUpdateCallback = callback;
    if (this.tournaments.length > 0) {
      callback([...this.tournaments]);
    }
  } */

  /* private notifyTournamentUpdate() {
    if (this.onTournamentUpdateCallback) {
      this.onTournamentUpdateCallback([...this.tournaments]);
    }
  } */

  public getTournaments() {
    return [...this.tournaments];
  }

  public getAuthenticated() {
    return this.isAuthenticated;
  }

  disconnect() {
    if (this.socket) {
      console.log(`👋 [Tournaments] ${t("ClosingWs")}`);
      this.socket.close();
    }
  }
}