import { FastifyInstance } from 'fastify';
import CreatePongTournamentRoute from './CreatePongTournament/CreatePongTournament.route';
import JoinPongTournamentRoute from './JointPongTournament/JoinPongTournament.route';
import LeavePongTournamentRoute from './LeavePongTournament/LeavePongTournament.route';
import GetActivePongTournamentsRoute from './GetActivePongTournaments/GetActivePongTournaments.route';
import GetCompletedPongTournamentsRoute from './GetCompletedPongTournaments/GetCompletedPongTournaments.route';
import GetPongTournamentDetailRoute from './GetPongTournamentDetail/GetPongTournamentDetail.route';
import StartTournamentRoute from './StartTournamentRoute/StartTournament.route';

export default async function PongTournamentsHttpRoutes(fastify: FastifyInstance) {
    // Add authentication hook for all routes in this feature
    fastify.addHook('preHandler', fastify.authenticate);

    fastify.register(CreatePongTournamentRoute);
    fastify.register(JoinPongTournamentRoute);
    fastify.register(LeavePongTournamentRoute);
    fastify.register(GetActivePongTournamentsRoute);
    fastify.register(GetCompletedPongTournamentsRoute);
    fastify.register(GetPongTournamentDetailRoute);
    fastify.register(StartTournamentRoute);
}
