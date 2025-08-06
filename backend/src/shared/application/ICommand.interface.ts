export interface ICommand {
    execute(): Promise<void>;
}

export interface ICommandHandler<T extends ICommand> {
    handle(command: T): Promise<void>;
}
