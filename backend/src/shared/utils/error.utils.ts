import { Result } from '@shared/abstractions/Result';

export interface ILogger {
    error: (error: unknown) => void;
}

export function handleError<T>(error: unknown, context: string, logger: ILogger, code: string): Result<T> {
    logger.error(error);

    const errorMessage =
        process.env.NODE_ENV === 'development'
            ? `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
            : 'Internal server error';

    return Result.failure(code, errorMessage);
}
