import { FastifyInstance } from 'fastify';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { badRequestError } from '@shared/Errors';

export const userNotFoundError: ErrorResult = 'userNotFoundError';

export const userAlredyExistsError: ErrorResult = 'userAlredyExistsError';

export const usernameUpdateError: ErrorResult = 'usernameUpdateError';

export interface IUsernameUpdateRequest {
	userId: number;
	username: string;
}

export interface IUsernameUpadteResponse {
	message: string;
	user: {
		id: number;
		username: string;
	};
}

export default class UsernameUpdateCommand implements ICommand<IUsernameUpdateRequest, IUsernameUpadteResponse> {
	private invalidRequestError = (): ErrorResult => {
		return '400';
	};

	constructor(private readonly fastify: FastifyInstance) {}

	validate(request?: IUsernameUpdateRequest): Result<void> {
		if (!request || !request.username) {
			return Result.error(badRequestError);
		}
		return Result.success(undefined);
	}

	async execute(request?: IUsernameUpdateRequest): Promise<Result<IUsernameUpadteResponse>> {
		if (!request) return Result.error(badRequestError);

		const { userId, username } = request;

		try {
			// Verify if user exists
			const userExists = await this.fastify.UserRepository.getUserById(userId);
			if (!userExists) {
				return Result.error(userNotFoundError);
			}

			// Verificar si el username ya está en uso
			const existingUser = await this.fastify.UserRepository.getUserByUsername(username);
			
			if (existingUser.isSuccess) {
				return Result.error(userAlredyExistsError);
			}

			// Actualizar username
			const updatedUser = await this.fastify.UserRepository.updateUsername(userId, username);
			if (!updatedUser.isSuccess || !updatedUser.value) {
				return Result.error(usernameUpdateError);
			}

			return Result.success({
				message: 'Username updated successfully',
				user: {
					id: updatedUser.value.id,
					username: updatedUser.value.username,
				},
			});
		} catch (error) {
			return this.fastify.handleError<IUsernameUpadteResponse>({
				code: '500',
				error,
			});
		}
	}
}
