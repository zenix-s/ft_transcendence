import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { IUserRepository } from '../repositories/User.IRepository';
import { verifyPassword } from '@shared/utils/password.utils';
import { FastifyInstance } from 'fastify';
import { handleError } from '@shared/utils/error.utils';
import { badRequestError } from '@shared/Errors';

const invalidCredentialsError: ErrorResult = 'invalidCredentialsError';

const invalidRequestError: ErrorResult = 'invalidRequestError';

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
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: ILoginRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        const { email, password } = request;

        if (!email || !password) {
            return Result.error(invalidRequestError);
        }

        return Result.success(undefined);
    }

    async execute(request?: ILoginRequest): Promise<Result<IAuthResponse>> {
        if (!request) return Result.error(badRequestError);
        const { email, password } = request;

        try {
            const userResult = await this.userRepository.getUserByEmail(email);
            if (!userResult.isSuccess || !userResult.value) {
                return Result.error(invalidCredentialsError);
            }

            const user = userResult.value;
            const isPasswordValid = await verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return Result.error(invalidCredentialsError);
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
            return handleError<IAuthResponse>(error, 'Login failed', this.fastify.log, '500');
        }
    }
}
