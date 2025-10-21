export enum ApplicationError {
    // Errores Generales
    UpdateError = 'UpdateError',
    DeletionError = 'DeletionError',
    InsertionError = 'InsertionError',
    NotFoundError = 'NotFoundError',

    /**
     * Solicitud Incorrecta - La solicitud carece de parámetros requeridos o está mal formada
     */
    BadRequest = 'BadRequest',

    /**
     * Solicitud Inválida - Los parámetros de la solicitud no cumplen con los requisitos de validación
     */
    InvalidRequest = 'InvalidRequest',

    /**
     * Error Interno del Servidor - Ocurrió un error inesperado en el servidor
     */
    InternalServerError = 'InternalServerError',

    /**
     * Servicio de Base de Datos No Disponible - El servicio de base de datos no está disponible actualmente
     */
    DatabaseServiceUnavailable = 'DatabaseServiceUnavailable',

    // Errores de Gestión de Usuario
    /**
     * Usuario No Encontrado - El usuario solicitado no existe en el sistema
     */
    UserNotFound = 'UserNotFound',

    /**
     * Usuario Ya Existe - Ya existe un usuario con este email o nombre de usuario
     */
    UserAlreadyExists = 'UserAlreadyExists',

    /**
     * Error de Creación de Usuario - Error al crear una nueva cuenta de usuario
     */
    UserCreationError = 'UserCreationError',

    /**
     * Error de Actualización de Nombre de Usuario - Error al actualizar el nombre de usuario
     */
    UsernameUpdateError = 'UsernameUpdateError',

    /**
     * Error de Actualización de Contraseña - Error al actualizar la contraseña del usuario
     */
    PasswordUpdateError = 'PasswordUpdateError',

    /**
     * Error de Actualización de Avatar - Error al actualizar el avatar del usuario
     */
    AvatarUpdateError = 'AvatarUpdateError',

    // Errores de Autenticación
    /**
     * Credenciales Inválidas - La combinación de email/contraseña proporcionada es incorrecta
     */
    InvalidCredentials = 'InvalidCredentials',

    /**
     * Token Inválido - El token de autenticación es inválido o está mal formado
     */
    InvalidToken = 'InvalidToken',

    // Errores de Juego
    /**
     * Juego No Encontrado - El juego especificado no existe
     */
    GameNotFound = 'GameNotFound',

    /**
     * Juego Ya Terminado - El juego ha terminado y no acepta más acciones
     */
    GameAlreadyFinished = 'GameAlreadyFinished',

    /**
     * Tipo de Juego No Encontrado - El tipo de juego especificado no existe
     */
    GameTypeNotFound = 'GameTypeNotFound',

    /**
     * Tipo de Juego Individual No Encontrado - El tipo de juego individual no está configurado
     */
    SinglePlayerGameTypeNotFound = 'SinglePlayerGameTypeNotFound',

    /**
     * Error de Creación de Juego - Error al crear una nueva instancia de juego
     */
    GameCreationError = 'GameCreationError',

    /**
     * Error de Actualización de Juego - Error al actualizar el estado del juego
     */
    GameUpdateError = 'GameUpdateError',

    /**
     * Juego Lleno - El juego ha alcanzado su capacidad máxima de jugadores
     */
    GameFull = 'GameFull',

    /**
     * Jugador No En Juego - El jugador no es participante de este juego
     */
    PlayerNotInGame = 'PlayerNotInGame',

    /**
     * Juego Individual Ya Tiene Jugador - El juego individual ya tiene un jugador asignado
     */
    SinglePlayerGameAlreadyHasPlayer = 'SinglePlayerGameAlreadyHasPlayer',

    /**
     * No Se Puede Unir al Juego Individual - No es posible unirse al juego individual
     */
    CannotJoinSinglePlayerGame = 'CannotJoinSinglePlayerGame',

    // Errores de Validación de Juego
    /**
     * Puntuación de Ganador Inválida - La puntuación ganadora debe estar entre 1 y 100
     */
    InvalidWinnerScore = 'InvalidWinnerScore',

    /**
     * Tiempo Máximo de Juego Inválido - El tiempo máximo de juego debe estar entre 60 y 3600 segundos
     */
    InvalidMaxGameTime = 'InvalidMaxGameTime',

    /**
     * Dificultad de IA Inválida - La dificultad de la IA debe estar entre 0 y 10
     */
    InvalidAiDifficulty = 'InvalidAiDifficulty',

    // Errores de Partida
    /**
     * Partida No Encontrada - La partida especificada no existe
     */
    MatchNotFound = 'MatchNotFound',

    /**
     * Partida Ya Terminada - La partida ha finalizado y no acepta más modificaciones
     */
    MatchAlreadyFinished = 'MatchAlreadyFinished',

    /**
     * Partida En Progreso - La partida está actualmente en curso y no puede ser modificada
     */
    MatchInProgress = 'MatchInProgress',

    /**
     * Jugador No Autorizado - El jugador no tiene permisos para realizar esta acción en el juego
     */
    PlayerNotAuthorized = 'PlayerNotAuthorized',

    /**
     * Acción No Permitida - La acción solicitada no está permitida en el estado actual del juego
     */
    ActionNotAllowed = 'ActionNotAllowed',

    // Errores de manejo de amistades

    AlreadyFriendsError = 'AlreadyFriendsError',
    FriendshipCreationError = 'FriendshipCreationError',
    NotFriendsError = 'NotFriendsError',
}
