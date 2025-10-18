import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { verifyPassword } from '@shared/utils/password.utils';
import { FastifyInstance } from 'fastify';
import { ApplicationError } from '@shared/Errors';

interface IAuthResponse {
    message: string;
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export default class LoginCommand implements ICommand<ILoginRequest, IAuthResponse> {
    constructor(private readonly fastify: FastifyInstance) {}

    validate(request?: ILoginRequest): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }

        const { email, password } = request;

        if (!email || !password) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(request?: ILoginRequest): Promise<Result<IAuthResponse>> {
        if (!request) return Result.error(ApplicationError.BadRequest);
        const { email, password } = request;

        try {
            const userResult = await this.fastify.UserRepository.getUserByEmail({ email });
            if (!userResult.isSuccess || !userResult.value) {
                return Result.error(ApplicationError.InvalidCredentials);
            }

            const user = userResult.value;
            const isPasswordValid = await verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return Result.error(ApplicationError.InvalidCredentials);
            }

            const token = this.fastify.jwt.sign({
                id: user.id,
                username: user.username,
                email: user.email,
            });

            return Result.success({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
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
