import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import PasswordUpdateCommand, { IPasswordUpdateRequest } from './updatePassword.command';
import { FastifyRequest } from 'fastify/types/request';

interface UpdatePasswordRequest {
	Body: {
		password?: string;
	};
}

export default async function UpdatePasswordRoute(fastify: FastifyInstance) {
	fastify.patch(
		'/updatepassword',
		{
			preHandler: [fastify.authenticate], // protege la ruta
			schema: {
				description: 'Update a user password hashing it',
				tags: ['Authentication'],
				security: [{ bearerAuth: [] }],
				body: {
					type: 'object',
					required: ['newPassword'],
					properties: {
						newPassword: {
							type: 'string',
							description: 'New password to update a user',
						},
					},
				},
				response: {
					200: {
						description: 'password updated successfully',
						type: 'object',
						properties: {
							message: { type: 'string' },
							user: {
								type: 'object',
								properties: {
									id: { type: 'number' },
									password: { type: 'string' },
								},
							},
						},
					},
					400: {
						description: 'Invalid request data',
						type: 'object',
						properties: {
							error: { type: 'string' },
						},
					},
				},
			},
		},
		async (req: FastifyRequest<{ Body: IPasswordUpdateRequest }>, reply: FastifyReply) => {
			const updatePasswordCommand = new PasswordUpdateCommand(fastify);

			// Extraemos el userId del token JWT (Fastify suele añadirlo como req.user)
			const userId = req.user.id;
			if (!userId) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const request = {
				userId,
				password: req.body.newPassword,
			};

			return fastify.handleCommand({
				command: updatePasswordCommand,
				request,
				reply,
				successStatus: 200,
			});
		}
	);
}
