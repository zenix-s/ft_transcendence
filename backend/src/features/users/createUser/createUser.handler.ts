// async function CreateUserHandler(request: ICreateUserRequest) {
//     // Logic to create a user
//     // This is where you would typically call the application layer to handle the business logic
//     return { message: "User created successfully", user: request };
// }

import { ICommand } from "@shared/application/ICommand.interface";

export default class CreateUserCommand
    implements ICommand<ICreateUserRequest, ICreateUserResponse>
{
    public async execute(
        request: ICreateUserRequest,
    ): Promise<ICreateUserResponse> {
        return {
            username: request.username,
            email: request.email,
        };
    }
}
