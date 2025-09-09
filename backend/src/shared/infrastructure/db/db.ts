import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { hashPassword } from '@shared/utils/password.utils';

export default fp(async (fastify: FastifyInstance) => {
    const connection = new SQLiteConnection(process.env.DB_PATH || 'bbdd/dev.db');
    await connection.connect();

    // USER
    await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT
        )
    `);

    // Insertar usuarios de prueba {DEBUG ONLY}
    const hashedPassword1 = await hashPassword('1234');
    const hashedPassword2 = await hashPassword('1234');

    await connection.execute(
        `
        INSERT OR IGNORE INTO users (username, email, password)
        VALUES
            ('testuser1', 'test1@example.com', ?),
            ('testuser2', 'test2@example.com', ?)
    `,
        [hashedPassword1, hashedPassword2]
    );

    // GAME data
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player1_id INTEGER,
            player2_id INTEGER,
            player1_score INTEGER DEFAULT 0,
            player2_score INTEGER DEFAULT 0,
            winner_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    fastify.decorate('dbConnection', connection);

    fastify.addHook('onClose', async () => {
        fastify.log.debug('closed db');
        await connection.disconnect();
    });
});
