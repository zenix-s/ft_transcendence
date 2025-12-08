import { getWsUrl } from "@/api";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { showToast } from "@/components/toast";
import { refreshTournamentsHistory } from "@/components/tournamentsHistory";
import { createGameSocket } from "../game/gameSocket";
import { modal } from "@/components/modal";

// TODO: Ajustar cuando el backend esté definido
interface payload {
  winnerId?: number;
  loserId?: number;
  message: string;
}

interface AuthSuccessMessage {
  action: "auth";
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

interface Tournament {
  id: number;
  name?: string;
  // otras propiedades del torneo
  [key: string]: unknown;
}

export class TournamentWebSocketClient {
  private socket: WebSocket | null = null;
  private token: string;
  private wsUrl: string;
  private isAuthenticated = false;
  private tournaments: Tournament[] = [];

  constructor(token: string) {
    this.wsUrl = getWsUrl("/tournaments/pong"); // Actualizar al EndPoint correspondiente a los torneos
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
        //console.log("📥 [Tournaments] raw WS message:", event.data); // DB
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
    const msg = { action: "auth", token: this.token };
    //const msg = { token: this.token };
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
      case "auth": {
        const msg = message as AuthSuccessMessage;
        this.isAuthenticated = true;
        console.log(`✅ [Tournaments] ${t("SuccessAuthenticated")}`, msg.userId);
        break;
      }

      // token inválido, formato incorrecto, acción desconocida, no autenticado, error del servidor
      case "error": {
        const msg = message as ErrorMessage;
        console.error(`❌ [Tournaments] ${t("ErrorFromServer")}:`, msg.message);
        showToast(`${t("ErrorFromServer")}: ${msg.message}`, "error");
        break;
      }

      // Enviado SÓLO A LOS PARTICIPANTES cuando el torneo comienza
      case "tournamentStarted": {
        const msg = message as tournamentStartedMessage;
        console.log(`🏆 [Tournaments] ${t("TournamentStarted")}`, msg.tournamentId);
        showToast(`${t("TournamentStarted")}: ${msg.tournamentId}`, "success");
        break;
      }

      // Enviado SÓLO A LOS PARTICIPANTES cuando el torneo termina
      case "tournamentEnded": {
        const msg = message as tournamentEndedMessage;
        console.log(`🏆 [Tournaments] ${t("TournamentEnded")}`, msg.tournamentId);
        showToast(`${t("TournamentEnded")}: ${msg.tournamentId}`, "success");
        break;
      }

      // Enviado SÓLO A LOS PARTICIPANTES cuando el estado del torneo cambia
      case "tournamentStateUpdated": {
        const msg = message as tournamentStateUpdatedMessage;
        console.log(`🔄 [Tournaments] ${t("TournamentStateUpdated")}`, msg.tournamentId);
        await refreshTournamentsHistory(); // Actualizar la historia de torneos
        break;
      }

      // Enviado SÓLO A LOS PARTICIPANTES cuando comienza una nueva ronda
      case "newRoundStarted": {
        const msg = message as newRoundStartedMessage;
        console.log(`🔔 [Tournaments] ${t("NewRoundStarted")}`, msg.roundNumber);
        showToast(`${t("NewRoundStarted")}: ${msg.roundNumber}`, "success");
        break;
      }

      // Enviado SÓLO AL PARTICIPANTE que debe jugar la partida
      case "matchCreated": {
            const msg = message as matchCreatedMessage;
            console.log(`🎮 [Tournaments] ${t("MatchCreated")}`, msg.matchId);
            
            // Mostrar modal de confirmación
            const confirmed = await modal({
                type: "gameInvitation",
                tournamentModal: true,
                gameName: "Tournament Match"
            });
            
            if (confirmed) {
                // Guardar el modo de juego en localStorage para que initGame3D() lo use
                const playerView = "2D";
                localStorage.setItem("pendingGameView", playerView);
                
                const token = localStorage.getItem("access_token");
		            createGameSocket(token, msg.matchId);

                // Solo navegar - initGame3D() se encargará del resto
                navigateTo(`playing?id=${msg.matchId}`);
            } else {
                console.log("Invitación de torneo rechazada");
                // Manejar rechazo (si es posible en torneos)
            }
            
            break;

      }

      // Enviado SÓLO A LOS PARTICIPANTES cuando se reporta el resultado de una partida
      case "matchResult": {
        const msg = message as matchResultMessage;
        console.log(`📊 [Tournaments] ${t("MatchResult")}`, msg.matchId);
        showToast(`${t("MatchResult")}: ${msg.matchId}`, "success");
        break;
      }

      // Enviado SÓLO AL PARTICIPANTE que gana el torneo
      case "tournamentWon": {
        const msg = message as tournamentWonMessage;
        console.log(`🏅 [Tournaments] ${t("TournamentWon")}`, msg.tournamentId);
        showToast(`${t("TournamentWon")}: ${msg.tournamentId}`, "success");
        break;
      }

      default:
        console.log(`📨 [Tournaments] ${t("MsgReceived")}`, message);
    }
  }

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