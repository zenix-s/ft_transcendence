import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import { TournamentWebSocketService } from '../websocket/tournament.websocket';
import fp from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        TournamentWebSocketService: TournamentWebSocketService;
    }
}

const TournamentWebSocketServicePlugin: FastifyPluginAsync<FastifyPluginOptions> = async (
    fastify: FastifyInstance
) => {
    // Paso 1: Crear instancia singleton de TournamentWebSocketService
    const tournamentWebSocketService = new TournamentWebSocketService(fastify);

    // Paso 2: Decorar la instancia de Fastify con el servicio
    fastify.decorate('TournamentWebSocketService', tournamentWebSocketService);
};

export default fp(TournamentWebSocketServicePlugin, {
    name: 'TournamentWebSocketServicePlugin',
    dependencies: ['DbConnection', 'TournamentRepository'],
});
