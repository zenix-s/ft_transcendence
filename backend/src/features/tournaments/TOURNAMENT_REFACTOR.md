# Refactorización del Sistema de Torneos - Eliminación Directa

## Resumen

El sistema de torneos ha sido completamente refactorizado para implementar un sistema de **eliminación directa clásica** (bracket tournament). Se eliminó el sistema previo basado en puntos y desafíos manuales.

## Cambios Principales

### 1. Sistema de Eliminación Directa

- **Brackets automáticos**: Los jugadores se emparejan automáticamente en cada ronda
- **1vs1**: Cada partido es entre dos jugadores
- **Contra IA**: Si hay un número impar de jugadores, el último juega contra la IA en dificultad máxima
- **Eliminación**: El perdedor de cada partido es eliminado del torneo
- **Progresión automática**: Cuando todos los partidos de una ronda terminan, se crea automáticamente la siguiente ronda

### 2. Nuevas Entidades de Dominio

#### TournamentRound (`TournamentRound.entity.ts`)

Representa una ronda del torneo con sus emparejamientos:

```typescript
interface ITournamentMatchup {
    player1Id: number;
    player2Id?: number; // undefined si juega contra AI
    winnerId?: number;
    matchId?: number;
    status: 'pending' | 'in_progress' | 'completed';
}
```

**Métodos principales:**
- `create({ roundNumber, playerIds })`: Crea una nueva ronda dividiendo a los jugadores en pares
- `setMatchupWinner(player1Id, winnerId)`: Marca el ganador de un emparejamiento
- `getWinners()`: Obtiene todos los ganadores de la ronda
- `isComplete`: Indica si todos los emparejamientos están completados

#### Tournament (actualizado)

Ahora incluye:
- `rounds: TournamentRound[]`: Lista de todas las rondas
- `currentRoundNumber: number`: Número de la ronda actual
- `createNextRound()`: Crea automáticamente la siguiente ronda con los ganadores
- `getCurrentRound()`: Obtiene la ronda actual

#### TournamentParticipant (actualizado)

Estados del participante:
- `registered`: Registrado pero el torneo no ha comenzado
- `active`: Participando activamente en el torneo
- `eliminated`: Eliminado del torneo
- `winner`: Ganador del torneo

### 3. Base de Datos

Se agregaron dos nuevas columnas a la tabla `tournaments`:

```sql
rounds_data TEXT DEFAULT '[]'  -- JSON con información de todas las rondas
current_round_number INTEGER DEFAULT 0  -- Número de ronda actual
```

### 4. Flujo del Torneo

#### A. Creación y Registro

1. Admin crea el torneo
2. Los usuarios se registran (estado: `registered`)
3. Admin inicia el torneo cuando hay suficientes participantes (mínimo 2)

#### B. Inicio del Torneo (startTournament)

1. Se verifica que hay al menos 2 participantes
2. Se cambia el estado del torneo a `ONGOING`
3. Todos los participantes pasan a estado `active`
4. **Se crea automáticamente la primera ronda** con todos los participantes
5. **Se crean automáticamente todos los matches** de la ronda
6. Se notifica por WebSocket a todos los participantes

#### C. Durante el Torneo

**Por cada match:**
1. Se crea el `Match` en la base de datos
2. Se crea el `PongGame` (con IA si es necesario)
3. Se notifica a los jugadores que su partida está lista
4. Los jugadores juegan
5. Cuando termina la partida, se ejecuta el callback `handleMatchResult`

**Callback handleMatchResult:**
1. Se marca el ganador en el matchup
2. Se elimina al perdedor (estado: `eliminated`)
3. Se notifica el resultado por WebSocket
4. **Si todos los matchups de la ronda terminaron**: se llama a `onRoundComplete`

**onRoundComplete:**
1. Se verifica si solo queda 1 jugador activo
   - **SI**: Ese jugador es el ganador → torneo finalizado
   - **NO**: Se crea la siguiente ronda con los ganadores
2. Se crean automáticamente todos los matches de la nueva ronda
3. Se notifica el inicio de la nueva ronda

### 5. Eliminaciones

#### Endpoints Eliminados

Los siguientes endpoints fueron **eliminados** por ser obsoletos:

- `ChallengePlayerRoute` - Ya no hay desafíos manuales
- `CreateChallengeRoute` - Ya no hay desafíos manuales
- `RespondChallengeRoute` - Ya no hay desafíos manuales
- `GetPendingChallengesRoute` - Ya no hay desafíos pendientes
- `EndTournamentRoute` - El torneo termina automáticamente

### 6. Notificaciones WebSocket

#### Nuevas Acciones

```typescript
enum TournamentSocketActions {
    MATCH_CREATED = 'matchCreated',        // Notifica que se creó un nuevo match
    MATCH_RESULT = 'matchResult',          // Notifica el resultado de un match
    NEW_ROUND_STARTED = 'newRoundStarted', // Notifica que comenzó una nueva ronda
    TOURNAMENT_WON = 'tournamentWon',      // Notifica al ganador
    TOURNAMENT_STARTED = 'tournamentStarted',
    TOURNAMENT_ENDED = 'tournamentEnded',
    // ... otros
}
```

#### Mensajes de WebSocket

**matchCreated:**
```json
{
    "action": "matchCreated",
    "tournamentId": 1,
    "matchId": 42,
    "gameId": 42,
    "opponentId": 5,  // null si es contra IA
    "isAgainstAI": false,
    "roundNumber": 2,
    "payload": {
        "message": "Tu partida de la ronda 2 ha sido creada"
    }
}
```

**newRoundStarted:**
```json
{
    "action": "newRoundStarted",
    "tournamentId": 1,
    "roundNumber": 3,
    "payload": {
        "message": "Comienza la ronda 3"
    }
}
```

**tournamentWon:**
```json
{
    "action": "tournamentWon",
    "tournamentId": 1,
    "userId": 10,
    "payload": {
        "message": "¡Felicidades! Has ganado el torneo"
    }
}
```

### 7. ActivePongTournament (refactorizado)

#### Métodos principales:

- `initialize()`: Crea el torneo y añade al creador como admin-participant
- `addParticipant()`: Añade un participante (solo en estado UPCOMING)
- `startTournament()`: Inicia el torneo y crea la primera ronda
- `createRoundMatches()`: Crea todos los matches de una ronda
- `createMatch()`: Crea un match individual (con o sin IA)
- `handleMatchResult()`: Callback cuando termina un match
- `onRoundComplete()`: Se ejecuta cuando todos los matches de una ronda terminan

#### Eliminado:

- `endTournament()`: Ya no es necesario, el torneo termina automáticamente
- `challengePlayer()`: Ya no hay desafíos manuales
- `recordMatchResult()`: Se maneja automáticamente por callbacks
- `canPlayMoreMatches()`: Ya no hay límite de partidas entre pares
- `matchCountBetweenPairs`: Ya no se registra este contador

### 8. Ejemplo de Flujo Completo

**Torneo con 5 jugadores:**

```
Inicio: [A, B, C, D, E]

Ronda 1:
  - Match 1: A vs B  → Gana A
  - Match 2: C vs D  → Gana C
  - Match 3: E vs IA → Gana E

Ganadores: [A, C, E]

Ronda 2:
  - Match 4: A vs C  → Gana A
  - Match 5: E vs IA → Gana E

Ganadores: [A, E]

Ronda 3 (Final):
  - Match 6: A vs E  → Gana A

Ganador del Torneo: A
```

### 9. Ventajas del Nuevo Sistema

1. **Simplicidad**: Sistema clásico de eliminación directa fácil de entender
2. **Automatización**: Todo se maneja automáticamente sin intervención manual
3. **Claridad**: Los usuarios saben exactamente cuándo y contra quién juegan
4. **Rapidez**: Los torneos progresan automáticamente
5. **Soporte para IA**: Los jugadores sin pareja enfrentan la IA
6. **Notificaciones en tiempo real**: Los usuarios son notificados inmediatamente

### 10. Puntos de Integración

- **PongGameManager**: Crea los juegos de torneo con callbacks
- **MatchRepository**: Gestiona los matches en la base de datos
- **TournamentRepository**: Persiste torneos con sus rondas
- **WebSocket**: Notifica eventos en tiempo real
- **ActivePongGame**: Ejecuta las partidas y llama callbacks al terminar

### 11. Consideraciones Técnicas

- Los matches se crean con `isTournamentMatch = true`
- Se usa el mismo ID para `matchId` y `gameId` para mantener sincronización
- Las rondas se almacenan como JSON en la base de datos
- El estado del torneo se persiste después de cada cambio importante
- Los callbacks aseguran que el flujo sea completamente automático