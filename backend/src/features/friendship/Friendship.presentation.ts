import { FastifyInstance } from 'fastify';
import AddFriendRoute from './AddFriend/AddFriend.route';
import RemoveFriendRoute from './RemoveFriend/RemoveFriend.route';

export default function FriendShipController(fastify: FastifyInstance) {
    // Add authentication hook for all routes in this feature
    fastify.addHook('preHandler', fastify.authenticate);

    fastify.register(AddFriendRoute);
    fastify.register(RemoveFriendRoute);
}
