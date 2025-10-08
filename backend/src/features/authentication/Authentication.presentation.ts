import { FastifyInstance } from 'fastify';
import CreateUserRoute from './CreateUser/CreateUser.route';
import LoginRoute from './LoginUser/Login.route';

export default function authRoutes(fastify: FastifyInstance) {
    fastify.register(CreateUserRoute);
    fastify.register(LoginRoute);
}