import { User } from '../../domain/User.entity';

export interface IUserRepository {
    createUser(user: Omit<User, 'id'>): Promise<User>;
    getUserByEmail(email: string): Promise<User | null>;
    getUserById(id: number): Promise<User | null>;
}
