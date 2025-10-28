import { FastifyInstance } from 'fastify';
import SendGameInvitationRoute from './SendGameInvitation/SendGameInvitation.route';
import AcceptGameInvitationRoute from './AcceptGameInvitation/AcceptGameInvitation.route';

export default async function GameInvitationHttpRoutes(fastify: FastifyInstance) {
    fastify.register(SendGameInvitationRoute);
    fastify.register(AcceptGameInvitationRoute);
}
