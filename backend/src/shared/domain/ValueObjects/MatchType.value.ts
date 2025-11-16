export default class MatchType {
    private readonly _id: number;
    private readonly _name: string;
    private readonly _minPlayers: number;
    private readonly _maxPlayers: number;
    private readonly _supportsInvitations: boolean;

    private constructor(
        id: number,
        name: string,
        minPlayers: number,
        maxPlayers: number,
        supportsInvitations: boolean
    ) {
        this._id = id;
        this._name = name;
        this._minPlayers = minPlayers;
        this._maxPlayers = maxPlayers;
        this._supportsInvitations = supportsInvitations;
    }

    // Definir las constantes primero como objetos simples
    private static readonly MATCH_TYPE_CONFIGS = {
        PONG: {
            ID: 1,
            NAME: 'pong' as const,
            MIN_PLAYERS: 2,
            MAX_PLAYERS: 2,
            SUPPORTS_INVITATIONS: true,
        },
        SINGLE_PLAYER_PONG: {
            ID: 2,
            NAME: 'single_player_pong' as const,
            MIN_PLAYERS: 1,
            MAX_PLAYERS: 1,
            SUPPORTS_INVITATIONS: false,
        },
        TOURNAMENT_PONG: {
            ID: 3,
            NAME: 'tournament_pong' as const,
            MIN_PLAYERS: 2,
            MAX_PLAYERS: 2,
            SUPPORTS_INVITATIONS: true,
        },
    };

    // Ahora crear las instancias usando las constantes ya definidas
    public static readonly PONG = new MatchType(
        MatchType.MATCH_TYPE_CONFIGS.PONG.ID,
        MatchType.MATCH_TYPE_CONFIGS.PONG.NAME,
        MatchType.MATCH_TYPE_CONFIGS.PONG.MIN_PLAYERS,
        MatchType.MATCH_TYPE_CONFIGS.PONG.MAX_PLAYERS,
        MatchType.MATCH_TYPE_CONFIGS.PONG.SUPPORTS_INVITATIONS
    );

    public static readonly SINGLE_PLAYER_PONG = new MatchType(
        MatchType.MATCH_TYPE_CONFIGS.SINGLE_PLAYER_PONG.ID,
        MatchType.MATCH_TYPE_CONFIGS.SINGLE_PLAYER_PONG.NAME,
        MatchType.MATCH_TYPE_CONFIGS.SINGLE_PLAYER_PONG.MIN_PLAYERS,
        MatchType.MATCH_TYPE_CONFIGS.SINGLE_PLAYER_PONG.MAX_PLAYERS,
        MatchType.MATCH_TYPE_CONFIGS.SINGLE_PLAYER_PONG.SUPPORTS_INVITATIONS
    );

    public static readonly TOURNAMENT_PONG = new MatchType(
        MatchType.MATCH_TYPE_CONFIGS.TOURNAMENT_PONG.ID,
        MatchType.MATCH_TYPE_CONFIGS.TOURNAMENT_PONG.NAME,
        MatchType.MATCH_TYPE_CONFIGS.TOURNAMENT_PONG.MIN_PLAYERS,
        MatchType.MATCH_TYPE_CONFIGS.TOURNAMENT_PONG.MAX_PLAYERS,
        MatchType.MATCH_TYPE_CONFIGS.TOURNAMENT_PONG.SUPPORTS_INVITATIONS
    );

    // Propiedad pública para mantener compatibilidad con el código existente
    public static readonly MATCH_TYPE = MatchType.MATCH_TYPE_CONFIGS;

    public get id(): number {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get minPlayers(): number {
        return this._minPlayers;
    }

    public get maxPlayers(): number {
        return this._maxPlayers;
    }

    public get supportsInvitations(): boolean {
        return this._supportsInvitations;
    }

    public static byName(name: string): MatchType | null {
        switch (name) {
            case MatchType.MATCH_TYPE_CONFIGS.SINGLE_PLAYER_PONG.NAME:
                return MatchType.SINGLE_PLAYER_PONG;
            case MatchType.MATCH_TYPE_CONFIGS.PONG.NAME:
                return MatchType.PONG;
            default:
                return null;
        }
    }

    public static byId(id: number): MatchType | null {
        switch (id) {
            case MatchType.MATCH_TYPE_CONFIGS.SINGLE_PLAYER_PONG.ID:
                return MatchType.SINGLE_PLAYER_PONG;
            case MatchType.MATCH_TYPE_CONFIGS.PONG.ID:
                return MatchType.PONG;
            default:
                return null;
        }
    }

    public static getAllTypes(): MatchType[] {
        return [MatchType.PONG, MatchType.SINGLE_PLAYER_PONG];
    }
}
