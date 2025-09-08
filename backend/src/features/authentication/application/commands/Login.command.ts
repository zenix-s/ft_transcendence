import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { IUserRepository } from '../repositories/User.IRepository';
import { PasswordUtils } from '@shared/utils/password.utils';
import { FastifyInstance } from 'fastify';
import {
    ILoginRequest,
    IAuthResponse,
    AUTH_ERRORS,
} from '../../types/auth.types';
import { handleError } from '@shared/utils/error.utils';

export default class LoginCommand
    implements ICommand<ILoginRequest, IAuthResponse>
{
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: ILoginRequest): Result<void> {
        if (!request) {
            return Result.failure('400', 'Request body is required');
        }

        const { email, password } = request;

        if (!email || !password) {
            return Result.failure('400', 'Email and password are required');
        }

        return Result.success(undefined);
    }

    async execute(request?: ILoginRequest): Promise<Result<IAuthResponse>> {
        if (!request) {
            return Result.failure('400', 'Request is required');
        }

        const { email, password } = request;

        try {
            // Find user by email
            const user = await this.userRepository.getUserByEmail(email);
            if (!user) {
                return Result.failure(
                    AUTH_ERRORS.INVALID_CREDENTIALS.code,
                    AUTH_ERRORS.INVALID_CREDENTIALS.message
                );
            }

            // Verify password
            const isPasswordValid = await PasswordUtils.verifyPassword(
                password,
                user.password
            );
            if (!isPasswordValid) {
                return Result.failure(
                    AUTH_ERRORS.INVALID_CREDENTIALS.code,
                    AUTH_ERRORS.INVALID_CREDENTIALS.message
                );
            }

            // Generate JWT token
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
            return handleError<IAuthResponse>(
                error,
                'Login failed',
                this.fastify.log
            );
        }
    }
}
