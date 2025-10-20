import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';

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

export default class UsernameUpdateCommand
    implements ICommand<IUsernameUpdateRequest, IUsernameUpadteResponse>
{
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IUsernameUpdateRequest): Result<void> {
        if (!request || !request.username) {
            return Result.error(ApplicationError.BadRequest);
        }
        return Result.success(undefined);
    }

    async execute(request?: IUsernameUpdateRequest): Promise<Result<IUsernameUpadteResponse>> {
        if (!request) return Result.error(ApplicationError.BadRequest);

        const { userId, username } = request;

        try {
            // Verify if user exists
            const userExists = await this.fastify.UserRepository.getUser({ id: userId });
            if (!userExists.isSuccess || !userExists.value) {
                return Result.error(ApplicationError.UserNotFound);
            }

            // Verificar si el username ya está en uso
            const existingUser = await this.fastify.UserRepository.getUser({
                username,
            });

            if (existingUser.isSuccess) {
                return Result.error(ApplicationError.UserAlreadyExists);
            }

            // Actualizar username
            const updatedUser = await this.fastify.UserRepository.updateUsername({
                id: userId,
                newUsername: username,
            });
            if (!updatedUser.isSuccess || !updatedUser.value) {
                return Result.error(ApplicationError.UsernameUpdateError);
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
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
