import { FastifyInstance } from 'fastify';
import CreatePongTournamentRoute from './CreatePongTournament/CreatePongTournament.route';
import JoinPongTournamentRoute from './JointPongTournament/JoinPongTournament.route';

export default async function PongTournamentsHttpRoutes(fastify: FastifyInstance) {
    fastify.register(CreatePongTournamentRoute);
    fastify.register(JoinPongTournamentRoute);
    // fastify.register(StartTournamentRoute);
    // fastify.register(LeaveTournamentRoute);
    // fastify.register(SendTournamentInvitationRoute);
    // fastify.register(AcceptTournamentInvitationRoute);
    // fastify.register(RejectTournamentInvitationRoute);
    // fastify.register(GetTournamentInvitationsRoute);
    // fastify.register(CancelTournamentRoute);
}
