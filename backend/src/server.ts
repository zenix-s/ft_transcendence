import app from './app';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { loadEnvFile } from 'node:process';
import fs from 'fs';

const port = 3000;
const host = '0.0.0.0';

const server = fastify({
    logger: true,
    https: {
        key: fs.readFileSync('./certs/key.pem'),
        cert: fs.readFileSync('./certs/cert.pem'),
    },
});

const start = async () => {
    loadEnvFile();

    server.addHook('preClose', () => {
        server.log.info('Closed connection');
    });

    const signals = ['SIGTERM', 'SIGINT'];

    signals.forEach((signal) => {
        process.once(signal, async () => {
            await server.close();
        });
    });

    try {
        await server.register(app);
        await server.register(cors, {
            origin: '*',
        });
        await server.listen({ port, host });
        console.log(`Server is running at http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
