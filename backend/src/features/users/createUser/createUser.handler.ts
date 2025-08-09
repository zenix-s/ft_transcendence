import Result from "@shared/abstractions/Result";
import { ICommand } from "@shared/application/ICommand.interface";
import { UserRepository } from "@features/users/user.repository";

interface ICreateUserRequest {
    username: string;
    email: string;
}

interface ICreateUserResponse {
    username: string;
    email: string;
}

export default class CreateUserCommand
    implements ICommand<ICreateUserRequest, ICreateUserResponse>
{
    private _userRepository: UserRepository;
    constructor() {
        this._userRepository = UserRepository.create();
    }

    public async execute(
        request: ICreateUserRequest,
    ): Promise<Result<ICreateUserResponse>> {
        try {
            if (!request.username || !request.email) {
                throw new Error("Username and email are required");
            }

            // const userRepository = UserRepository.create();
            await this._userRepository.createUser(request);

            return Result.success({
                username: request.username,
                email: request.email,
            });
        } catch (error) {
            return Result.failure(
                "Error",
                "Ha ocurrido un error al crear el usuario",
            );
        }
    }
}
