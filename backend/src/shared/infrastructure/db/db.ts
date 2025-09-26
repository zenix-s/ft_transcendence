import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { hashPassword } from '@shared/utils/password.utils';

export default fp(async (fastify: FastifyInstance) => {
    const connection = new SQLiteConnection(process.env.DB_PATH || 'bbdd/dev.db');
    await connection.connect();

    // USERS TABLE
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // GAME TYPES TABLE - Define los diferentes tipos de juegos disponibles
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS game_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            min_players INTEGER NOT NULL DEFAULT 2,
            max_players INTEGER NOT NULL DEFAULT 2,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // MATCHES TABLE - Historial de partidas
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_type_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            started_at DATETIME,
            ended_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (game_type_id) REFERENCES game_types(id),
            CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
        )
    `);

    // MATCH PLAYERS TABLE - Jugadores en cada partida
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS match_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            score INTEGER DEFAULT 0,
            is_winner BOOLEAN DEFAULT 0,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(match_id, user_id)
        )
    `);

    // ÍNDICES para mejorar el rendimiento
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_matches_game_type ON matches(game_type_id)`);
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)`);
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id)`);
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id)`);

    // DATOS DE PRUEBA {DEBUG ONLY}

    // Insertar usuarios de prueba
    const hashedPassword1 = await hashPassword('1234');
    const hashedPassword2 = await hashPassword('1234');

    await connection.execute(
        `
        INSERT OR IGNORE INTO users (username, email, password)
        VALUES
            ('player1', 'player1@example.com', ?),
            ('player2', 'player2@example.com', ?)
        `,
        [hashedPassword1, hashedPassword2]
    );

    // Insertar tipos de juegos
    await connection.execute(`
        INSERT OR IGNORE INTO game_types (name, display_name, min_players, max_players)
        VALUES
            ('pong', 'Pong Classic', 2, 2),
            ('pong_4p', 'Pong 4 Players', 4, 4)
    `);

    fastify.decorate('dbConnection', connection);

    fastify.addHook('onClose', async () => {
        fastify.log.debug('Closing database connection');
        await connection.disconnect();
    });
});
