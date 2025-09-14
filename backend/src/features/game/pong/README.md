# Pong Game Architecture

## Overview

The Pong game feature has been refactored to follow a clean architecture pattern with proper separation of concerns. The implementation follows the same architectural principles as the authentication feature, using Command/Query patterns, Repository pattern, and domain-driven design.

## Game Flow

1. **Create Game**: A user creates a new game and receives a game ID
2. **Join Game**: Both players join the game using the game ID
3. **Ready Check**: Both players must indicate they are ready via WebSocket
4. **Auto Start**: Game automatically starts when both players are ready
5. **Play**: Players control paddles via WebSocket
6. **End**: Game ends when conditions are met

## Architecture Components

### 1. Domain Layer (`/domain`)

- **PongGame.ts**: Pure domain entity representing a pong game
  - No infrastructure dependencies
  - Contains all game logic (player management, ball physics, collision detection)
  - Maintains game state without external concerns

- **PongPlayer**: Value object representing a player in the game
  - Manages player position and score
  - Encapsulates player movement logic

### 2. Application Layer (`/application`)

#### Mediators (Commands & Queries)

- **CreateGame.command.ts**: Handles game creation
  - Validates input (currently empty, but extensible)
  - Creates new game instances
  - Returns game ID

- **JoinGame.command.ts**: Handles players joining games
  - Validates game exists
  - Manages player assignment
  - Prevents overfilling games

- **SetPlayerReady.command.ts**: Handles player ready state
  - Validates player is in the game
  - Sets player ready status
  - Auto-starts game when both players are ready

- **GetGameState.query.ts**: Retrieves current game state
  - Read-only operation
  - Returns full game state for display

#### Repositories

- **Game.IRepository.ts**: Interface defining game storage operations
  - Abstracts storage implementation
  - Provides CRUD operations for games

### 3. Infrastructure Layer (`/infrastructure`)

- **Game.repository.ts**: In-memory implementation of IGameRepository
  - Currently uses Map for storage
  - Can be replaced with database implementation without changing application layer

### 4. Presentation Layer

- **Pong.presentation.ts**: HTTP and WebSocket endpoints
  - Uses command/query pattern for all operations
  - Handles WebSocket connections for real-time updates
  - Manages game loops for active games

## Key Design Decisions

### 1. Removal of Static Methods
- Removed `PongGame.createGame()` static method
- Game creation now handled by CreateGame command
- Better testability and separation of concerns

### 2. Removal of Global State
- Eliminated global `Games` Map
- State now managed by repository
- Easier to test and scale

### 3. Command/Query Segregation
- Write operations use Commands
- Read operations use Queries
- Clear separation of concerns

### 4. Repository Pattern
- Abstracts storage mechanism
- Easy to swap implementations
- Currently in-memory, can add database later

### 5. Domain Purity
- PongGame has no external dependencies
- All game logic contained within domain
- Infrastructure concerns handled separately

## API Endpoints

### HTTP Endpoints

- `POST /create` - Create a new game
- `POST /join/:gameId` - Join an existing game
- `GET /state/:gameId` - Get current game state

### WebSocket Actions

- `REQUEST_STATE` - Subscribe to game state updates
- `SET_READY` - Indicate player is ready to start
- `MOVE_UP` - Move paddle up
- `MOVE_DOWN` - Move paddle down

## Extension Points

### Adding Game Configuration
1. Update `ICreateGameRequest` interface with configuration options
2. Modify `PongGame` constructor to accept configuration
3. Update validation in `CreateGame.command.ts`

### Adding Persistence
1. Create new repository implementation (e.g., `SqliteGameRepository`)
2. Implement `IGameRepository` interface
3. Replace repository instantiation in presentation layer

### Adding Game Modes
1. Create game mode enum in domain
2. Add mode property to `PongGame`
3. Implement mode-specific logic in game update methods

## Testing Strategy

The new architecture makes testing much easier:

1. **Domain Tests**: Test game logic in isolation
2. **Command Tests**: Test business logic with mock repositories
3. **Repository Tests**: Test storage operations
4. **Integration Tests**: Test full flow with real implementations

## Benefits

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Each component can be tested in isolation
3. **Extensibility**: Easy to add new features
4. **Scalability**: Can easily add database persistence
5. **Consistency**: Follows same patterns as other features