import { FastifyInstance } from 'fastify';
import SendGameInvitationRoute from './SendGameInvitation/SendGameInvitation.route';
import AcceptGameInvitationRoute from './AcceptGameInvitation/AcceptGameInvitation.route';
import RejectGameInvitationRoute from './RejectGameInvitation/RejectGameInvitation.route';

export default async function GameInvitationHttpRoutes(fastify: FastifyInstance) {
    // Add authentication hook for all routes in this feature
    fastify.addHook('preHandler', fastify.authenticate);

    fastify.register(SendGameInvitationRoute);
    fastify.register(AcceptGameInvitationRoute);
    fastify.register(RejectGameInvitationRoute);
}
