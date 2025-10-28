import { FastifyInstance } from 'fastify';
import CreateGameRoute from './CreatePongGame/CreateGame.route';
import CreatePongSinglePlayerGameRoute from './CreatePongSinglePlayerGame/CreatePongSinglePlayerGame.route';
import JoinPongGameRoute from './JoinPongGame/JoinPongGame.route';
import GetGameStateRoute from './GetPongGameState/GetPongGameState.route';

export default async function PongGameHttpRoutes(fastify: FastifyInstance) {
    fastify.register(CreateGameRoute);
    fastify.register(CreatePongSinglePlayerGameRoute);
    fastify.register(JoinPongGameRoute);
    fastify.register(GetGameStateRoute);
}
