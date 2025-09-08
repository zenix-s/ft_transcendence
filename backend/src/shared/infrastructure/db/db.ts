// src/shared/infrastructure/plugins/db.plugin.ts
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { SQLiteConnection } from '@shared/infrastructure/db/SQLiteConnection';
import { PasswordUtils } from '@shared/utils/password.utils';

export default fp(async (fastify: FastifyInstance) => {
    const connection = new SQLiteConnection(
        process.env.DB_PATH || 'bbdd/dev.db'
    );
    await connection.connect();

    // Optional schema creation
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT
    )
  `);

    // Insertar usuarios de prueba {DEBUG ONLY}
    const hashedPassword1 = await PasswordUtils.hashPassword('1234');
    const hashedPassword2 = await PasswordUtils.hashPassword('1234');

    await connection.execute(
        `
        INSERT OR IGNORE INTO users (username, email, password)
        VALUES
            ('testuser1', 'test1@example.com', ?),
            ('testuser2', 'test2@example.com', ?)
    `,
        [hashedPassword1, hashedPassword2]
    );
    // await connection.execute(`DELETE FROM users`);

    fastify.decorate('dbConnection', connection);

    fastify.addHook('onClose', async () => {
        fastify.log.debug('closed db');
        await connection.disconnect();
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        dbConnection: SQLiteConnection;
    }
}
