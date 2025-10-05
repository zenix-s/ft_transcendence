import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify/types/instance';
import GameTypeRepository from './GameTypeRepository';
import MatchPlayerRepository from './MatchPlayerRepository';
import MatchRepository from './MatchRepository';
import UserRepository from './UserRepository';
import PongGameRepository from './PongGame.repository';

export default fp(
    (fastify: FastifyInstance) => {
        fastify.register(GameTypeRepository);
        fastify.register(MatchPlayerRepository);
        fastify.register(MatchRepository);
        fastify.register(UserRepository);
        fastify.register(PongGameRepository);
    },
    {
        name: 'Repositories',
        dependencies: ['DbConnection'],
    }
);
