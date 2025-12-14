import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import bcrypt from 'bcrypt';

declare module 'fastify' {
    interface FastifyInstance {
        hashPassword: (password: string) => Promise<string>;
        verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>;
    }
}

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt with configured salt rounds
 */
const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against a hashed password using bcrypt
 */
const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

const PasswordPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.decorate('hashPassword', hashPassword);
    fastify.decorate('verifyPassword', verifyPassword);
};

export default fp(PasswordPlugin, {
    name: 'passwordPlugin',
});

// Export raw functions for use outside Fastify context
export { hashPassword, verifyPassword };
