import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify/types/instance';
import MatchPlayerRepository from './MatchPlayerRepository';
import MatchRepository from './MatchRepository';
import UserRepository from './UserRepository';
import FriendShipRepository from './FriendShipRepository';

export default fp(
    (fastify: FastifyInstance) => {
        fastify.register(MatchPlayerRepository);
        fastify.register(MatchRepository);
        fastify.register(UserRepository);
        fastify.register(FriendShipRepository);
    },
    {
        name: 'Repositories',
        dependencies: ['DbConnection'],
    }
);
