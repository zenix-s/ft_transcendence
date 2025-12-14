import { FastifyReply, FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { IQuery } from '@shared/application/abstractions/IQuery.interface';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { ApplicationError } from '@shared/Errors';

declare module 'fastify' {
    interface FastifyInstance {
        handleQuery<TRequest, TResponse>({
            query,
            request,
            reply,
            successStatus,
        }: {
            query: IQuery<TRequest, TResponse>;
            request: TRequest | undefined;
            reply: FastifyReply;
            successStatus?: number;
        }): Promise<FastifyReply>;

        handleCommand<TRequest, TResponse>({
            command,
            request,
            reply,
            successStatus,
        }: {
            command: ICommand<TRequest, TResponse>;
            request: TRequest | undefined;
            reply: FastifyReply;
            successStatus?: number;
        }): Promise<FastifyReply>;
    }
}

/**
 * Maps application error codes to HTTP status codes
 */
const getStatusCodeForError = (error: string): number => {
    switch (error) {
        case ApplicationError.GameNotFound:
        case ApplicationError.UserNotFound:
        case ApplicationError.MatchNotFound:
            return 404;
        case ApplicationError.GameAlreadyFinished:
        case ApplicationError.MatchAlreadyFinished:
            return 410;
        case ApplicationError.BadRequest:
        case ApplicationError.InvalidRequest:
        case ApplicationError.InvalidCredentials:
        case ApplicationError.InvalidWinnerScore:
        case ApplicationError.InvalidMaxGameTime:
        case ApplicationError.InvalidAiDifficulty:
            return 400;
        case ApplicationError.InvalidToken:
        case ApplicationError.PlayerNotAuthorized:
            return 401;
        case ApplicationError.ActionNotAllowed:
        case ApplicationError.PlayerNotInGame:
            return 403;
        case ApplicationError.GameFull:
        case ApplicationError.UserAlreadyExists:
        case ApplicationError.AlreadyFriendsError:
        case ApplicationError.CannotAddSelfAsFriend:
        case ApplicationError.CannotRemoveSelfAsFriend:
        case ApplicationError.MatchInProgress:
            return 409;
        case ApplicationError.InternalServerError:
        case ApplicationError.DatabaseServiceUnavailable:
            return 500;
        default:
            return 409; // Default conflict status
    }
};

/**
 * Executes a query with validation and error handling
 */
const handleQuery = async <TRequest, TResponse>({
    query,
    request,
    reply,
    successStatus = 200,
}: {
    query: IQuery<TRequest, TResponse>;
    request: TRequest | undefined;
    reply: FastifyReply;
    successStatus?: number;
}): Promise<FastifyReply> => {
    const validationResult = query.validate(request);
    if (!validationResult.isSuccess) {
        return reply.status(400).send({ error: validationResult.error });
    }

    const result = await query.execute(request);
    if (!result.isSuccess) {
        const statusCode = getStatusCodeForError(result.error || 'UnknownError');
        return reply.status(statusCode).send({ error: result.error });
    }

    return reply.status(successStatus).send(result.value);
};

/**
 * Executes a command with validation and error handling
 */
const handleCommand = async <TRequest, TResponse>({
    command,
    request,
    reply,
    successStatus = 200,
}: {
    command: ICommand<TRequest, TResponse>;
    request: TRequest | undefined;
    reply: FastifyReply;
    successStatus?: number;
}): Promise<FastifyReply> => {
    const validationResult = command.validate(request);
    if (!validationResult.isSuccess) {
        return reply.status(400).send({ error: validationResult.error });
    }

    const result = await command.execute(request);
    if (!result.isSuccess) {
        const statusCode = getStatusCodeForError(result.error || 'UnknownError');
        return reply.status(statusCode).send({ error: result.error });
    }

    return reply.status(successStatus).send(result.value);
};

const MediatorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.decorate('handleQuery', (payload) => handleQuery(payload));
    fastify.decorate('handleCommand', (payload) => handleCommand(payload));
};

export default fp(MediatorHandlerPlugin, {
    name: 'mediatorHandlerPlugin',
});
