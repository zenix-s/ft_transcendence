import Result from "@shared/abstractions/Result";

export interface IQuery<TRequest = void, TResult = void> {
    execute(request?: TRequest): Promise<Result<TResult>>;
}
