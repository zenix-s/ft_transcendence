import { FastifyInstance } from 'fastify';
import UpdateUsernameRoute from './updateUsername/updateUsername.route';

export default function userManagerRoutes(fastify: FastifyInstance) {
	fastify.register(UpdateUsernameRoute);
}