import { Result } from '@shared/abstractions/Result';

export interface ICommand<TRequest = void, TResult = void> {
    validate(request?: TRequest): Result<void>;
    execute(request?: TRequest): Promise<Result<TResult>>;
}
