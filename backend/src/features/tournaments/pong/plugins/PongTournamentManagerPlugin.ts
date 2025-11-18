import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import { PongTournamentManager } from '../services/PongTournamentManager';
import fp from 'fastify-plugin';
import { IPongTournamentManager } from '../services/IPongTournamentManager';

declare module 'fastify' {
    interface FastifyInstance {
        PongTournamentManager: IPongTournamentManager;
    }
}

const PongTournamentManagerPlugin: FastifyPluginAsync<FastifyPluginOptions> = async (
    fastify: FastifyInstance
) => {
    // Paso 1: Crear instancia singleton de PongTournamentManager
    const pongTournamentManager = new PongTournamentManager(fastify);

    // Paso 2: Decorar la instancia de Fastify con el servicio
    fastify.decorate('PongTournamentManager', pongTournamentManager);
};

export default fp(PongTournamentManagerPlugin, {
    name: 'PongTournamentManagerPlugin',
    dependencies: ['DbConnection', 'Repositories'],
});
