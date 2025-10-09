import { FastifyInstance } from 'fastify';
import uploadAvatarRoute from './UploadAvatar/UploadAvatar.route';

export default function userManagerRoutes(fastify: FastifyInstance) {
    fastify.register(uploadAvatarRoute);
}
