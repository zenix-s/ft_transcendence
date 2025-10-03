import { FastifyInstance } from 'fastify';
import { IUserRepository } from '@features/authentication/application/repositories/User.IRepository';
import { ErrorResult, Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { hashPassword } from '@shared/utils/password.utils';
import { badRequestError } from '@shared/Errors';

export const userNotFoundError: ErrorResult = 'userNotFoundError';

export const userAlredyExistsError: ErrorResult = 'userAlredyExistsError';

export const userCreationError: ErrorResult = 'userCreationError';

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
    private invalidRequestError = (): ErrorResult => {
        return '400';
    };

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly fastify: FastifyInstance
    ) {}

    validate(request?: IRegisterRequest): Result<void> {
        if (!request) {
            return Result.error(badRequestError);
        }

        const { username, email, password } = request;

        let error = '';

        if (!username) error += 'Username is required. ';
        if (!email) error += 'Email is required. ';
        if (!password) error += 'Password is required. ';

        if (error) {
            return Result.error(this.invalidRequestError());
        }

        return Result.success(undefined);
    }

    async execute(request?: IRegisterRequest): Promise<Result<IAuthResponse>> {
        if (!request) return Result.error(badRequestError);
        const { username, email, password } = request;

        try {
            const existingUser = await this.userRepository.getUserByEmail(email);
            if (existingUser.isSuccess) {
                return Result.error(userAlredyExistsError);
            }

            const hashedPassword = await hashPassword(password);

            const user = await this.userRepository.createUser({
                username,
                email,
                password: hashedPassword,
            });

            if (!user.isSuccess || !user.value) {
                return Result.error(userCreationError);
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
                code: '500',
                error,
            });
        }
    }
}
