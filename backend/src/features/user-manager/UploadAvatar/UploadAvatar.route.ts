import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import UploadAvatarCommand from './UploadAvatar.application';

export default async function uploadAvatarRoute(fastify: FastifyInstance) {
    fastify.post(
        '/upload-avatar',
        {
            preHandler: [fastify.authenticate],
            schema: {
                description: 'Upload user avatar',
                tags: ['UserManager'],
                consumes: ['multipart/form-data'],
                security: [{ bearerAuth: [] }],
                response: {
                    200: {
                        description: 'Avatar uploaded successfully',
                        type: 'object',
                        properties: {
                            avatarUrl: {
                                type: 'string',
                                description: 'URL of the uploaded avatar',
                            },
                            message: {
                                type: 'string',
                            },
                        },
                    },
                    400: {
                        description: 'Bad request - Invalid file or missing data',
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                                enum: ['NoFileProvided', 'InvalidFileType', 'FileTooLarge', 'InvalidRequest'],
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - Missing or invalid token',
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                            },
                        },
                    },
                    404: {
                        description: 'User not found',
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                            },
                        },
                    },
                    500: {
                        description: 'Internal server error',
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                            },
                        },
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const data = await request.file();
            if (!data) {
                fastify.log.error('No file found in request');
                return reply.status(400).send({
                    error: 'NoFileProvided',
                });
            }

            const userId = request.user.id;
            const command = new UploadAvatarCommand(fastify);

            const commandRequest = {
                userId: userId,
                file: data,
            };

            return fastify.handleCommand({
                command,
                reply,
                request: commandRequest,
                successStatus: 200,
            });
        }
    );
}
