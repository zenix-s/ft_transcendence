export interface ICommand<TRequest = void, TResult = void> {
    execute(request?: TRequest): Promise<TResult>;
}
