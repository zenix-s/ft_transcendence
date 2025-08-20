// src/shared/infrastructure/plugins/db.plugin.ts
import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { SQLiteConnection } from "@shared/infrastructure/db/SQLiteConnection";

export default fp(async (fastify: FastifyInstance) => {
    const connection = new SQLiteConnection(
        process.env.DB_PATH || "bbdd/dev.db",
    );
    await connection.connect();

    // Optional schema creation
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        friends NUMBER
    )
  `);
 
  // Insertar usuarios de prueba {DEBUG ONLY}
    await connection.execute(`
        INSERT OR IGNORE INTO users (username, email, friends)
        VALUES 
            ('testuser1', 'test1@example.com', 5),
            ('testuser2', 'test2@example.com', 10)
    `);
    //await connection.execute(`DELETE FROM users`);

    fastify.decorate("dbConnection", connection);

    fastify.addHook("onClose", async () => {
        fastify.log.debug("closed db");
        await connection.disconnect();
    });
});

declare module "fastify" {
    interface FastifyInstance {
        dbConnection: SQLiteConnection;
    }
}
