import { FastifyInstance } from 'fastify';
import UpdateUsernameRoute from './updateUsername/updateUsername.route';
import UpdatePasswordRoute from './updatePassword/updatePassword.route';

export default function userManagerRoutes(fastify: FastifyInstance) {
	fastify.register(UpdateUsernameRoute);
	fastify.register(UpdatePasswordRoute);
}