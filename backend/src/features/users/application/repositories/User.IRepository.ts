import { User } from "../../domain/User.entity";
import { ICreateUserDto } from "../dto/CreateUserDto.interface";

export interface IUserRepository {
    createUser(user: ICreateUserDto): Promise<User>;
    getAllUsers(page?: number, limit?: number): Promise<User[]>;
    countUsers(): Promise<number>;
}
