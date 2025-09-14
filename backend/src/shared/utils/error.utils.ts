import { Result } from '@shared/abstractions/Result';

export interface ILogger {
    error: (error: unknown) => void;
}

export function handleError<T>(error: unknown, context: string, logger: ILogger, code: string): Result<T> {
    logger.error(error);

    return Result.failure(code);
}
