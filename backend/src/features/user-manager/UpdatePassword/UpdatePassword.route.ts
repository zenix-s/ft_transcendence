import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import PasswordUpdateCommand from './UpdatePassword.command';

interface UpdatePasswordRequestBody {
	password: string;
}

export default async function UpdatePasswordRoute(fastify: FastifyInstance) {
	fastify.patch(
		'/update-password',
		{
			schema: {
				description: 'Update a user password hashing it',
				tags: ['Authentication'],
				security: [{ bearerAuth: [] }],
				body: {
					type: 'object',
					required: ['password'],
					properties: {
						password: {
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
		async (req: FastifyRequest<{ Body: UpdatePasswordRequestBody }>, reply: FastifyReply) => {
			const updatePasswordCommand = new PasswordUpdateCommand(fastify);

			// Extraemos el userId del token JWT (Fastify suele añadirlo como req.user)
			const userId = req.user.id;
			if (!userId) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const request = {
				userId,
				password: req.body.password,
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
