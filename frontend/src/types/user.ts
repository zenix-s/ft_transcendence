export interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
}

export interface GetCurrentUserResponse {
    user: User;
}
