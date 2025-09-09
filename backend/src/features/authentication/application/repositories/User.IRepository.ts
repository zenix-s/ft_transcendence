import { Result } from '@shared/abstractions/Result';
import { User } from '@shared/domain/entity/User.entity';

export interface AuthenticationUserDto extends User {
    password: string;
}

export type CreateUserDto = Omit<AuthenticationUserDto, 'id'>;

export interface IUserRepository {
    createUser(user: CreateUserDto): Promise<Result<User>>;
    getUserByEmail(email: string): Promise<Result<AuthenticationUserDto>>;
    getUserById(id: number): Promise<Result<AuthenticationUserDto>>;
}
