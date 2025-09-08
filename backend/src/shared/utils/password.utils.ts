import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class PasswordUtils {
    private static readonly SALT_LENGTH = 32;
    private static readonly KEY_LENGTH = 64;

    /**
     * Hash a password using scrypt
     * @param password - The plain text password
     * @returns The hashed password in format salt:hash
     */
    public static async hashPassword(password: string): Promise<string> {
        const salt = randomBytes(this.SALT_LENGTH).toString('hex');
        const hash = (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
        return `${salt}:${hash.toString('hex')}`;
    }

    /**
     * Verify a password against a hash
     * @param password - The plain text password to verify
     * @param hashedPassword - The stored hashed password
     * @returns True if the password matches
     */
    public static async verifyPassword(
        password: string,
        hashedPassword: string
    ): Promise<boolean> {
        const [salt, storedHash] = hashedPassword.split(':');

        if (!salt || !storedHash) {
            return false;
        }

        const hash = (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
        return hash.toString('hex') === storedHash;
    }
}
