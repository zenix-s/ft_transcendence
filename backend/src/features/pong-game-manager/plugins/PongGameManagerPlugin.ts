import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { PongGameManager } from '../services/PongGameManager';

declare module 'fastify' {
    interface FastifyInstance {
        PongGameManager: PongGameManager;
    }
}

const PongGameManagerPlugin: FastifyPluginAsync<FastifyPluginOptions> = async (fastify: FastifyInstance) => {
    // Crear instancia singleton de PongGameManager
    const pongGameManager = new PongGameManager(fastify);

    // Decorar la instancia de Fastify con el servicio
    fastify.decorate('PongGameManager', pongGameManager);

    // Agregar hooks para gestión del ciclo de vida
    fastify.addHook('onClose', async (instance) => {
        // Limpiar cualquier juego activo cuando el servidor se apague
        instance.log.info('Cleaning up PongGameManager active games');

        // Obtener todos los IDs de juegos activos y limpiarlos
        const activeGameIdsResult = pongGameManager.getActiveGameIds();
        if (activeGameIdsResult.isSuccess && activeGameIdsResult.value) {
            const activeGameIds = activeGameIdsResult.value;
            for (const gameId of activeGameIds) {
                const deleteResult = pongGameManager.deleteGame(gameId);
                if (!deleteResult.isSuccess) {
                    instance.log.error(
                        `Failed to delete game ${gameId}: ${deleteResult.error || 'Unknown error'}`
                    );
                }
            }
            instance.log.info(`Cleaned up ${activeGameIds.length} active pong games`);
        } else {
            instance.log.error('Failed to get active game IDs for cleanup');
        }
    });
};

export default fp(PongGameManagerPlugin, {
    name: 'pongGameManager',
    dependencies: ['DbConnection', 'Repositories'],
});
