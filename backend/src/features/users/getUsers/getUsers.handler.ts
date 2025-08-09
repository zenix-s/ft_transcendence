import { IQuery } from "@shared/application/IQuery.interface";
import { IUserRepository } from "../User.IRepository";
import { UserRepository } from "../user.repository";
import Result from "@shared/abstractions/Result";

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
    totalCount: number;
}

export default class GetUsersQuery
    implements IQuery<IGetUsersRequest, IGetUsersResponse>
{
    public async execute(
        request: IGetUsersRequest = { page: 1, limit: 10 },
    ): Promise<Result<IGetUsersResponse>> {
        const userRepository: IUserRepository = await UserRepository.create();
        const { page, limit } = request;

        const users = await userRepository.getAllUsers();
        const totalCount: number = users.length;

        return Result.success({
            users: users.map((user) => ({
                id: user.id,
                username: "juan",
                email: "pedro",
            })),
            totalCount: totalCount,
        } as IGetUsersResponse);
    }
}
