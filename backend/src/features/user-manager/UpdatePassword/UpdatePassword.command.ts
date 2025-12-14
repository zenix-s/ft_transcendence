import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';

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

export default class PasswordUpdateCommand implements ICommand<
    IPasswordUpdateRequest,
    IPasswordUpadteResponse
> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IPasswordUpdateRequest): Result<void> {
        if (!request || !request.password) {
            return Result.error(ApplicationError.BadRequest);
        }
        return Result.success(undefined);
    }

    async execute(request?: IPasswordUpdateRequest): Promise<Result<IPasswordUpadteResponse>> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }

        const { userId, password } = request;

        try {
            // Verify if user exists
            const userExists = await this.fastify.UserRepository.getUser({ id: userId });
            if (!userExists.isSuccess || !userExists.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            // Hash password
            const hashedPassword = await this.fastify.hashPassword(password);

            // Update password in bbdd
            const updatedPassword = await this.fastify.UserRepository.updatePassword({
                id: userId,
                newPassword: hashedPassword,
            });
            if (!updatedPassword.isSuccess || !updatedPassword.value) {
                return Result.error(ApplicationError.PasswordUpdateError);
            }

            return Result.success({
                message: 'Password updated successfully',
                user: {
                    id: updatedPassword.value.id,
                },
            });
        } catch (error) {
            return this.fastify.handleError<IPasswordUpadteResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
