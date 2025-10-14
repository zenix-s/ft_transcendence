import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { hashPassword } from '@shared/utils/password.utils';

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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                max_players INTEGER NOT NULL DEFAULT 2
            )
        `);

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
                INSERT OR IGNORE INTO users (username, email, password)
                VALUES
                    ('AI_Player', 'ai@system.local', ?)
            `,
            [hashedPasswordAI]
        );

        // TestUsers
        const hashedPasswordTest = await hashPassword('Testpassword1234');
        await connection.execute(
            `
                INSERT OR IGNORE INTO users (username, email, password)
                VALUES
                    ('TestUser1', 'TestUser1@gmail.com', ?),
                    ('TestUser2', 'TestUser2@gmail.com', ?)
            `,
            [hashedPasswordTest, hashedPasswordTest]
        );

        await connection.execute(`
            INSERT OR IGNORE INTO game_types (name, min_players, max_players)
            VALUES
                ('pong', 2, 2),
                ('single_player_pong', 1, 1)
        `);

        fastify.decorate('DbConnection', connection);
        fastify.addHook('onClose', async () => {
            await connection.disconnect();
        });
    },
    {
        name: 'DbConnection',
    }
);
