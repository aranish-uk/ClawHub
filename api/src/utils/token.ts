import crypto from 'crypto';

export function generateToken(prefix: string = 'claw'): string {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${randomBytes}`;
}
