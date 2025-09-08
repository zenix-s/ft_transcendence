import { Result } from '@shared/abstractions/Result';

export interface ILogger {
    error: (error: any) => void;
}

/**
 * Handles errors consistently across the application
 * - Logs the error for debugging
 * - Returns appropriate error message based on environment
 *
 * @param error - The caught error
 * @param context - Context message for logging (e.g., 'Login error', 'Registration error')
 * @param logger - Logger instance (usually fastify.log)
 * @param code - HTTP status code (default: '500')
 * @returns Result with failure containing appropriate error message
 */
export function handleError<T>(
    error: unknown,
    context: string,
    logger: ILogger,
    code: string = '500'
): Result<T> {
    // Log the full error for debugging
    logger.error(error);

    // Construct error message based on environment
    const errorMessage =
        process.env.NODE_ENV === 'development'
            ? `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
            : 'Internal server error';

    return Result.failure(code, errorMessage);
}
