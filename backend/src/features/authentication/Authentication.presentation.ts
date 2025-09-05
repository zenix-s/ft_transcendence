import { FastifyInstance } from "fastify";

export default async function authRoutes(fastify: FastifyInstance)
{
    fastify.get('/me', async(req, reply) => {
        return reply.status(200).send();
    })
    
    fastify.post('/login', async(req, reply) => {
        return reply.status(200).send();
    })
    
    fastify.post('/register', async(req, reply) => {
        return reply.status(200).send();
    })
}