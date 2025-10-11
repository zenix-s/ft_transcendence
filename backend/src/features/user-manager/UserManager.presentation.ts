import { FastifyInstance } from 'fastify';
import UpdatePasswordRoute from './updatePassword/updatePassword.route';
import UploadAvatarRoute from './UploadAvatar/UploadAvatar.route';
import UpdateUsernameRoute from './updateUsername/updateUsername.route';

export default function userManagerRoutes(fastify: FastifyInstance) {
    fastify.register(UploadAvatarRoute);
    fastify.register(UpdateUsernameRoute);
    fastify.register(UpdatePasswordRoute);
}
