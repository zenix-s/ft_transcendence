import { FastifyReply } from 'fastify';
import { Result } from '@shared/abstractions/Result';

async function handleCommand<TRequest, TResponse>(
    commandOrQuery: {
        validate(request?: TRequest): Result<void>;
        execute(request?: TRequest): Promise<Result<TResponse>>;
    },
    request: TRequest | undefined,
    reply: FastifyReply,
    successStatus = 200
): Promise<FastifyReply> {
    const validationResult = commandOrQuery.validate(request);
    if (!validationResult.isSuccess) {
        return reply.status(400).send({ error: validationResult.error });
    }

    const result = await commandOrQuery.execute(request);
    if (!result.isSuccess) {
        return reply.status(409).send({ error: result.error });
    }

    return reply.status(successStatus).send(result.value);
}

export { handleCommand };
