export interface IQuery<TRequest = void, TResult = void> {
    execute(request?: TRequest): Promise<TResult>;
}
