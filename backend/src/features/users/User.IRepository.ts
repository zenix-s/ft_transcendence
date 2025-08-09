import { ICreateUserDto } from "./dto/CreateUserDto.interface";

export interface IUserRepository {
    createUser(createUserDto: ICreateUserDto): Promise<void>;
    getAllUsers(): Promise<Array<{ id: number }>>;
}
