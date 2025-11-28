import { FastifyInstance } from 'fastify';
import CreatePongTournamentRoute from './CreatePongTournament/CreatePongTournament.route';
import JoinPongTournamentRoute from './JointPongTournament/JoinPongTournament.route';
import LeavePongTournamentRoute from './LeavePongTournament/LeavePongTournament.route';
import GetActivePongTournamentsRoute from './GetActivePongTournaments/GetActivePongTournaments.route';
import GetPongTournamentDetailRoute from './GetPongTournamentDetail/GetPongTournamentDetail.route';
import StartTournamentRoute from './StartTournamentRoute/StartTournament.route';

export default async function PongTournamentsHttpRoutes(fastify: FastifyInstance) {
    fastify.register(CreatePongTournamentRoute);
    fastify.register(JoinPongTournamentRoute);
    fastify.register(LeavePongTournamentRoute);
    fastify.register(GetActivePongTournamentsRoute);
    fastify.register(GetPongTournamentDetailRoute);
    fastify.register(StartTournamentRoute);
}
