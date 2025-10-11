import { FastifyInstance } from 'fastify';
import UploadAvatarRoute from './UploadAvatar/UploadAvatar.route';
import UpdateUsernameRoute from './UpdateUsername/UpdateUsername.route';

export default function userManagerRoutes(fastify: FastifyInstance) {
    fastify.register(UploadAvatarRoute);
    fastify.register(UpdateUsernameRoute);
}
