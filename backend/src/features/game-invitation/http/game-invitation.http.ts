import { FastifyInstance } from 'fastify';
import SendGameInvitationRoute from './SendGameInvitation/SendGameInvitation.route';

export default async function GameInvitationHttpRoutes(fastify: FastifyInstance) {
    fastify.register(SendGameInvitationRoute);
}
