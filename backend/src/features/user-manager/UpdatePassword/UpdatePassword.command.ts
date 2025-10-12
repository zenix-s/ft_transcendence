import { FastifyInstance } from 'fastify';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { badRequestError } from '@shared/Errors';
import { hashPassword } from '@shared/utils/password.utils';

export const userNotFoundError: ErrorResult = 'userNotFoundError';

export const passwordUpdateError: ErrorResult = 'passwordUpdateError';

export interface IPasswordUpdateRequest {
	userId: number;
	password: string;
}

export interface IPasswordUpadteResponse {
	message: string;
	user: {
		id: number;
	};
}

export default class PasswordUpdateCommand implements ICommand<IPasswordUpdateRequest, IPasswordUpadteResponse> {
	constructor(private readonly fastify: FastifyInstance) {}

	validate(request?: IPasswordUpdateRequest): Result<void> {
		if (!request || !request.password) {
			return Result.error(badRequestError);
		}
		return Result.success(undefined);
	}

	async execute(request?: IPasswordUpdateRequest): Promise<Result<IPasswordUpadteResponse>> {
		if (!request) {
			return Result.error(badRequestError);
		}

		const { userId, password } = request;

		try {
			// Verify if user exists
			const userExists = await this.fastify.UserRepository.getUserById(userId);
			if (!userExists) {
				return Result.error(userNotFoundError);
			}

			// Hash password
			const hashedPassword = await hashPassword(password);

			// Update password in bbdd
			const updatedPassword = await this.fastify.UserRepository.updatePassword(userId, hashedPassword);
			if (!updatedPassword.isSuccess || !updatedPassword.value) {
				return Result.error(passwordUpdateError);
			}

			return Result.success({
				message: 'Password updated successfully',
				user: {
					id: updatedPassword.value.id,
				},
			});
		} catch (error) {
			return this.fastify.handleError<IPasswordUpadteResponse>({
				code: '500',
				error,
			});
		}
	}
}
