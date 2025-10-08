import { FastifyInstance } from 'fastify';
import GetCurrentUserRoute from './GetCurrentUser/GetCurrentUser.route';
import UpdateUsernameRoute from './updateUsername/updateUsername.route';

export default function ProtectedAuthRoutes(fastify: FastifyInstance) {
    fastify.register(GetCurrentUserRoute);
    fastify.register(UpdateUsernameRoute);
}