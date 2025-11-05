import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { hashPassword } from '@shared/utils/password.utils';
import { CONSTANTES_APP } from '@shared/constants/ApplicationConstants';

export default fp(
    async (fastify: FastifyInstance) => {
        const connection = new SQLiteConnection(process.env.DB_PATH || 'bbdd/dev.db');
        await connection.connect();

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                avatar TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_connected BOOLEAN DEFAULT 0
            )
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS friendships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,
                UNIQUE(user_id, friend_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS game_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                min_players INTEGER NOT NULL DEFAULT 2,
                max_players INTEGER NOT NULL DEFAULT 2,
                supports_invitations BOOLEAN NOT NULL DEFAULT 1
            )
        `);

        await connection.execute(
            `
                CREATE TABLE IF NOT EXISTS matches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    game_type_id INTEGER NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    started_at DATETIME,
                    ended_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (game_type_id) REFERENCES game_types(id),
                    CHECK (status IN (?, ?, ?, ?))
                )
            `,
            [
                // STATUS
                CONSTANTES_APP.MATCH.STATUS.PENDING,
                CONSTANTES_APP.MATCH.STATUS.IN_PROGRESS,
                CONSTANTES_APP.MATCH.STATUS.COMPLETED,
                CONSTANTES_APP.MATCH.STATUS.CANCELLED,
            ]
        );

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS match_players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                score INTEGER DEFAULT 0,
                is_winner BOOLEAN DEFAULT 0,
                FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(match_id, user_id)
            )
        `);

        await connection.execute(`CREATE INDEX IF NOT EXISTS idx_matches_game_type ON matches(game_type_id)`);
        await connection.execute(`CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)`);
        await connection.execute(
            `CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id)`
        );
        await connection.execute(
            `CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id)`
        );

        const hashedPasswordAI = await hashPassword('AI_SYSTEM_USER_NO_LOGIN');

        await connection.execute(
            `
                INSERT OR IGNORE INTO users (id, username, email, password)
                VALUES
                    (?, ?, ?, ?)
            `,
            [
                CONSTANTES_APP.AI_PLAYER.ID,
                CONSTANTES_APP.AI_PLAYER.NAME,
                CONSTANTES_APP.AI_PLAYER.EMAIL,
                hashedPasswordAI,
            ]
        );

        await connection.execute(
            `
                INSERT OR IGNORE INTO game_types (name, min_players, max_players, supports_invitations)
                VALUES
                    (?,?,?,?),
                    (?,?,?,?)
            `,
            [
                // Pong
                CONSTANTES_APP.MATCH_TYPE.PONG.NAME,
                CONSTANTES_APP.MATCH_TYPE.PONG.MIN_PLAYERS,
                CONSTANTES_APP.MATCH_TYPE.PONG.MAX_PLAYERS,
                CONSTANTES_APP.MATCH_TYPE.PONG.SUPPORTS_INVITATIONS ? 1 : 0,
                // Single Player Pong
                CONSTANTES_APP.MATCH_TYPE.SINGLE_PLAYER_PONG.NAME,
                CONSTANTES_APP.MATCH_TYPE.SINGLE_PLAYER_PONG.MIN_PLAYERS,
                CONSTANTES_APP.MATCH_TYPE.SINGLE_PLAYER_PONG.MAX_PLAYERS,
                CONSTANTES_APP.MATCH_TYPE.SINGLE_PLAYER_PONG.SUPPORTS_INVITATIONS ? 1 : 0,
            ]
        );

        // ESTO ES PARA TESTING NO LLEVAR A PROD
        // TestUsers
        const hashedPasswordTest = await hashPassword('Testpassword1234');
        await connection.execute(
            `
                INSERT OR IGNORE INTO users (id, username, email, password)
                VALUES
                    (2, 'TestUser1', 'TestUser1@gmail.com', ?),
                    (3, 'TestUser2', 'TestUser2@gmail.com', ?)
            `,
            [hashedPasswordTest, hashedPasswordTest]
        );

        // Friendship between TestUser1 and TestUser2
        await connection.execute(
            `
                INSERT OR IGNORE INTO friendships (user_id, friend_id)
                VALUES
                    (2, 3),
                    (3, 2)
            `
        );

        fastify.decorate('DbConnection', connection);
        fastify.addHook('onClose', async () => {
            // Set all users as disconnected on server shutdown
            await connection.execute('UPDATE users SET is_connected = 0');

            await connection.disconnect();
        });
    },
    {
        name: 'DbConnection',
    }
);
