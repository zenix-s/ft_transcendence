import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { IUserRepository } from '../repositories/User.IRepository';
import { PasswordUtils } from '@shared/utils/password.utils';
import { FastifyInstance } from 'fastify';
import {
    IRegisterRequest,
    IAuthResponse,
    AUTH_ERRORS,
} from '../../types/auth.types';
import { handleError } from '@shared/utils/error.utils';

export default class CreateUserCommand
    implements ICommand<IRegisterRequest, IAuthResponse>
{
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: IRegisterRequest): Result<void> {
        if (!request) {
            return Result.failure('400', 'Request body is required');
        }

        const { username, email, password } = request;

        if (!username || !email || !password) {
            return Result.failure(
                '400',
                'Username, email, and password are required'
            );
        }

        return Result.success(undefined);
    }

    async execute(request?: IRegisterRequest): Promise<Result<IAuthResponse>> {
        if (!request) {
            return Result.failure('400', 'Request is required');
        }

        const { username, email, password } = request;

        try {
            // Check if user already exists
            const existingUser =
                await this.userRepository.getUserByEmail(email);
            if (existingUser) {
                return Result.failure(
                    AUTH_ERRORS.USER_ALREADY_EXISTS.code,
                    AUTH_ERRORS.USER_ALREADY_EXISTS.message
                );
            }

            // Hash password
            const hashedPassword = await PasswordUtils.hashPassword(password);

            // Create user
            const user = await this.userRepository.createUser({
                username,
                email,
                password: hashedPassword,
            });

            // Generate JWT token
            const token = this.fastify.jwt.sign({
                id: user.id,
                username: user.username,
                email: user.email,
            });

            return Result.success({
                message: 'User registered successfully',
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
                'Registration failed',
                this.fastify.log
            );
        }
    }
}
