import { User } from "../../domain/User.entity";

export interface IUserRepository {
    createUser(user: Omit<User, "id">): Promise<User>;
    getAllUsers(page?: number, limit?: number): Promise<User[]>;
    countUsers(): Promise<number>;
}
