import { Result } from '@shared/abstractions/Result';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { IUserRepository } from '../repositories/User.IRepository';

export interface ICreateUserRequest {
    username: string;
    email: string;
    password: string;
}

export interface ICreateUserResponse {
    statusCode: number;
    message: string;
}

export default class CreateUserCommand
    implements ICommand<ICreateUserRequest, ICreateUserResponse>
{
    constructor(private readonly userRepository: IUserRepository) {}

    validate(request?: ICreateUserRequest | undefined): Result<void> {
        if (request === undefined)
            return Result.failure('400', 'Request body is required');

        const { username, email, password } = request;

        if (!username || !email || !password)
            return Result.failure(
                '400',
                'Username, email, and password are required'
            );

        return Result.success(undefined);
    }

    async execute(
        request?: ICreateUserRequest | undefined
    ): Promise<Result<ICreateUserResponse>> {
        if (!request) return Result.failure('400', 'Request is required');

        const { username, email, password } = request;

        try {
            const user = await this.userRepository.createUser({
                username,
                email,
                password,
            });
            return Result.success({
                statusCode: 201,
                message: 'User created successfully with ID: ' + user.id,
            });
        } catch (error) {
            return Result.failure('500', `Error creating user: ${error}`);
        }
    }
}
