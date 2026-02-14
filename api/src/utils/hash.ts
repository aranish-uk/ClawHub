import * as argon2 from 'argon2';
import crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, plain);
    } catch (err) {
        return false;
    }
}

export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}
