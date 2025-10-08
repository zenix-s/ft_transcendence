import { FastifyInstance } from 'fastify/types/instance';
import { FastifyReply } from 'fastify/types/reply';
import UsernameUpdateCommand, { IUsernameUpdateRequest } from './updateUsername.command';
import { FastifyRequest } from 'fastify/types/request';

interface UpdateUsernameRequest {
	Body: {
		username?: string;
	};
}

export default async function UpdateUsernameRoute(fastify: FastifyInstance) {
	fastify.patch(
		'/updateusername',
		{
			preHandler: [fastify.authenticate], // protege la ruta
			schema: {
				description: 'Update a user name',
				tags: ['Authentication'],
				security: [{ bearerAuth: [] }],
				body: {
					type: 'object',
					required: ['username'],
					properties: {
						username: {
							type: 'string',
							description: 'New user name to update a user',
						},
					},
				},
				response: {
					200: {
						description: 'username updated successfully',
						type: 'object',
						properties: {
							message: { type: 'string' },
							user: {
								type: 'object',
								properties: {
									id: { type: 'number' },
									username: { type: 'string' },
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
		async (req: FastifyRequest<{ Body: IUsernameUpdateRequest }>, reply: FastifyReply) => {
			const updateUsernameCommand = new UsernameUpdateCommand(fastify);

			// Extraemos el userId del token JWT (Fastify suele añadirlo como req.user)
			const userId = (req as any).user?.id;
			if (!userId) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const request = {
				userId,
				username: req.body.username,
			};

			return fastify.handleCommand({
				command: updateUsernameCommand,
				request,
				reply,
				successStatus: 200,
			});
		}
	);
}
