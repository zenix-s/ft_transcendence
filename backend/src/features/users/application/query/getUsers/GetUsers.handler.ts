import { IQuery } from "@shared/application/abstractions/IQuery.interface";
import { IUserRepository } from "@features/users/application/repositories/User.IRepository";
import { Result } from "@shared/abstractions/Result";

export interface IGetUsersRequest {
    page?: number;
    limit?: number;
}

export interface IGetUsersResponse {
    users: Array<{
        id: number;
        username: string;
        email: string;
    }>;
}

export default class GetUsersQuery
    implements IQuery<IGetUsersRequest, IGetUsersResponse>
{
    constructor(private readonly userRepository: IUserRepository) {}

    public async execute(
        request: IGetUsersRequest = { page: 1, limit: 10 },
    ): Promise<Result<IGetUsersResponse>> {
        const { page, limit } = request;

        const users = await this.userRepository.getAllUsers();

        return Result.success({
            users: users.map((user) => ({
                id: user.id,
                username: user.username,
                email: user.email,
            })),
        });
    }
}
