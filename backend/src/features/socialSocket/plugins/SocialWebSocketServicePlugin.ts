import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { SocialWebSocketService } from '../services/SocialWebSocketService';

declare module 'fastify' {
    interface FastifyInstance {
        SocialWebSocketService: SocialWebSocketService;
    }
}

const SocialWebSocketServicePlugin: FastifyPluginAsync<FastifyPluginOptions> = async (
    fastify: FastifyInstance
) => {
    // Create singleton instance of SocialWebSocketService
    const socialWebSocketService = new SocialWebSocketService(fastify);

    // Decorate Fastify instance with the service
    fastify.decorate('SocialWebSocketService', socialWebSocketService);

    // Optional: Add hooks for lifecycle management
    fastify.addHook('onClose', async (instance) => {
        // Clean up any active connections when server shuts down
        instance.log.info('Cleaning up SocialWebSocketService connections');
        // The service could have a cleanup method if needed
    });
};

export default fp(SocialWebSocketServicePlugin, {
    name: 'socialWebSocketService',
    dependencies: ['DbConnection', 'UserRepository', 'FriendShipRepository'],
});
