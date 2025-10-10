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
		password: string;
	};
}

export default class PasswordUpdateCommand implements ICommand<IPasswordUpdateRequest, IPasswordUpadteResponse> {
	private invalidRequestError = (): ErrorResult => {
		return '400';
	};

	constructor(private readonly fastify: FastifyInstance) {}

	validate(request?: IPasswordUpdateRequest): Result<void> {
		if (!request || !request.password) {
			console.log("[validate] Invalid request:", request);
			return Result.error(badRequestError);
		}
		console.log("[validate] Request valid");
		return Result.success(undefined);
	}

	async execute(request?: IPasswordUpdateRequest): Promise<Result<IPasswordUpadteResponse>> {
		console.log("[execute] Starting password update...");
		if (!request) {
			console.log("[execute] Missing request");
			return Result.error(badRequestError);
		}

		const { userId, password } = request;
		console.log("[execute] Request data:", { userId, passwordLength: password ? password.length : "none" });

		try {
			console.log("[execute] Hashing password...");
			const hashedPassword = await hashPassword(password);
			console.log("[execute] Hashed password generated (length):", hashedPassword?.length);

			console.log("[execute] Updating password in database...");
			const updatedPassword = await this.fastify.UserRepository.updatePassword(userId, hashedPassword);
			console.log("[execute] Repository response:", updatedPassword);

			if (!updatedPassword.isSuccess || !updatedPassword.value) {
				console.log("[execute] Password update failed:", updatedPassword);
				return Result.error(passwordUpdateError);
			}

			console.log("[execute] Password updated successfully for user:", updatedPassword.value.id);
			return Result.success({
				message: 'Password updated successfully',
				user: {
					id: updatedPassword.value.id,
					password: updatedPassword.value.password,
				},
			});
		} catch (error) {
			console.log("[execute] Unexpected error:", error);
			return this.fastify.handleError<IPasswordUpadteResponse>({
				code: '500',
				error,
			});
		}
	}
}
