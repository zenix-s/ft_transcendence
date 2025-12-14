import { FastifyInstance } from 'fastify';
import UpdatePasswordRoute from './UpdatePassword/UpdatePassword.route';
import UploadAvatarRoute from './UploadAvatar/UploadAvatar.route';
import UpdateUsernameRoute from './UpdateUsername/UpdateUsername.route';

export default function userManagerRoutes(fastify: FastifyInstance) {
    // Add authentication hook for all routes in this feature
    fastify.addHook('preHandler', fastify.authenticate);

    fastify.register(UploadAvatarRoute);
    fastify.register(UpdateUsernameRoute);
    fastify.register(UpdatePasswordRoute);
}
