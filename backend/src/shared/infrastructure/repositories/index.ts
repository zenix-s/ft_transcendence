import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify/types/instance';
import GameTypeRepository from './GameTypeRepository';
import MatchPlayerRepository from './MatchPlayerRepository';
import MatchRepository from './MatchRepository';
import UserRepository from './UserRepository';
import PongGameRepository from '../../../features/pong-game-manager/infrastructure/PongGame.repository';
import FriendShipRepository from './FriendShipRepository';

export default fp(
    (fastify: FastifyInstance) => {
        fastify.register(GameTypeRepository);
        fastify.register(MatchPlayerRepository);
        fastify.register(MatchRepository);
        fastify.register(UserRepository);
        fastify.register(PongGameRepository);
        fastify.register(FriendShipRepository);
    },
    {
        name: 'Repositories',
        dependencies: ['DbConnection'],
    }
);
