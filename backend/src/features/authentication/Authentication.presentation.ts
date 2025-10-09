import { FastifyInstance } from 'fastify';
import CreateUserRoute from './CreateUser/CreateUser.route';
import LoginRoute from './LoginUser/Login.route';
import GetCurrentUserRoute from './GetCurrentUser/GetCurrentUser.route';

export default function authRoutes(fastify: FastifyInstance) {
    fastify.register(CreateUserRoute);
    fastify.register(LoginRoute);
    fastify.register(GetCurrentUserRoute);
}