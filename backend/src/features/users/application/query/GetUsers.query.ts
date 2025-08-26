import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { IUserRepository } from '@features/users/application/repositories/User.IRepository';
import { Result } from '@shared/abstractions/Result';

export interface IGetUsersRequest {
    page?: number;
    limit?: number;
}

export interface IGetUsersResponse {
    users: Array<{
        id: number;
        username: string;
        email: string;
        password: string; // ONLY FOR TESTING
        friends: number;
    }>;
}

export default class GetUsersQuery
    implements IQuery<IGetUsersRequest, IGetUsersResponse>
{
    constructor(private readonly userRepository: IUserRepository) {}

    public validate(request?: IGetUsersRequest): Result<void> {
        if (!request) {
            return Result.success(undefined);
        }

        const { page, limit } = request;

        if (page !== undefined && page < 1) {
            return Result.failure('400', 'Page must be greater than 0');
        }

        if (limit !== undefined && limit < 1) {
            return Result.failure('400', 'Limit must be greater than 0');
        }

        return Result.success(undefined);
    }

    public async execute(
        request: IGetUsersRequest = { page: 1, limit: 10 }
    ): Promise<Result<IGetUsersResponse>> {
        let { page, limit } = request;
        page ??= 1;
        limit ??= 10;

        const users = await this.userRepository.getAllUsers();

        if (!users || users.length === 0)
            return Result.failure('404', 'No users found');

        // Pagination logic
        const start: number = (page - 1) * limit;
        const end: number = start + limit;

        const paginatedUsers = users.slice(start, end);
        if (paginatedUsers.length === 0)
            return Result.failure('404', 'No users found for the given page');

        return Result.success({
            users: paginatedUsers.map((user) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                password: user.password,
                friends: user.friends,
            })),
        });
    }
}
