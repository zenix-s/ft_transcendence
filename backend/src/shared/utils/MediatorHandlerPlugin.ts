import { FastifyReply } from 'fastify/types/reply';
import { IQuery } from '../application/abstractions/IQuery.interface';
import { ICommand } from '../application/abstractions/ICommand.interface';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function handleQuery<TRequest, TResponse>({
    query,
    request,
    reply,
    successStatus = 200,
}: {
    query: IQuery<TRequest, TResponse>;
    request: TRequest | undefined;
    reply: FastifyReply;
    successStatus?: number;
}): Promise<FastifyReply> {
    const validationResult = query.validate(request);
    if (!validationResult.isSuccess) {
        return reply.status(400).send({ error: validationResult.error });
    }

    const result = await query.execute(request);
    if (!result.isSuccess) {
        return reply.status(409).send({ error: result.error });
    }

    return reply.status(successStatus).send(result.value);
}

async function handleCommand<TRequest, TResponse>({
    command,
    request,
    reply,
    successStatus = 200,
}: {
    command: ICommand<TRequest, TResponse>;
    request: TRequest | undefined;
    reply: FastifyReply;
    successStatus?: number;
}): Promise<FastifyReply> {
    const validationResult = command.validate(request);
    if (!validationResult.isSuccess) {
        return reply.status(400).send({ error: validationResult.error });
    }

    const result = await command.execute(request);
    if (!result.isSuccess) {
        return reply.status(409).send({ error: result.error });
    }

    return reply.status(successStatus).send(result.value);
}

function mediatorPlugin(fastify: FastifyInstance) {
    fastify.decorate('handleQuery', handleQuery);
    fastify.decorate('handleCommand', handleCommand);
}

export default fp(mediatorPlugin);
