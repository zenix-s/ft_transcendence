import { FastifyInstance } from 'fastify';
import AddFriendRoute from './AddFriend/AddFriend.route';
import RemoveFriendRoute from './RemoveFriend/RemoveFriend.route';

export default function FriendShipController(fastify: FastifyInstance) {
    fastify.register(AddFriendRoute);
    fastify.register(RemoveFriendRoute);
}
