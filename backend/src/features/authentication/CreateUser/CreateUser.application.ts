import { FastifyInstance } from 'fastify';
import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { hashPassword } from '@shared/plugins/PasswordPlugin';
import { ApplicationError } from '@shared/Errors';

export interface IRegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface IAuthResponse {
    message: string;
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
}

export default class CreateUserCommand implements ICommand<IRegisterRequest, IAuthResponse> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: IRegisterRequest): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }

        const { username, email, password } = request;

        let error = '';

        if (!username) error += 'Username is required. ';
        if (!email) error += 'Email is required. ';
        if (!password) error += 'Password is required. ';

        if (error) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(request?: IRegisterRequest): Promise<Result<IAuthResponse>> {
        if (!request) return Result.error(ApplicationError.BadRequest);
        const { username, password } = request;

        const email = request.email.toLowerCase();

        try {
            const existingUserEmail = await this.fastify.UserRepository.getUser({
                email,
            });
            if (existingUserEmail.isSuccess) {
                return Result.error(ApplicationError.UserAlreadyExists);
            }

            const existingUsername = await this.fastify.UserRepository.getUser({
                username,
            });
            if (existingUsername.isSuccess) {
                return Result.error(ApplicationError.UserAlreadyExists);
            }

            const hashedPassword = await hashPassword(password);

            const user = await this.fastify.UserRepository.createUser({
                user: {
                    username,
                    email,
                    password: hashedPassword,
                },
            });

            if (!user.isSuccess || !user.value) {
                return Result.error(ApplicationError.UserCreationError);
            }

            const token = this.fastify.jwt.sign({
                id: user.value.id,
                username: user.value.username,
                email: user.value.email,
            });

            return Result.success({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.value.id,
                    username: user.value.username,
                    email: user.value.email,
                },
            });
        } catch (error) {
            return this.fastify.handleError<IAuthResponse>({
                code: ApplicationError.InternalServerError,
                error,
            });
        }
    }
}
