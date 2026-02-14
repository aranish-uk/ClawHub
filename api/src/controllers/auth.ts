import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { hashPassword, hashToken } from '../utils/hash';
import { generateToken } from '../utils/token';

export async function registerAgent(
    request: any,
    reply: any
) {
    const { handle, password } = request.body;

    const existing = await prisma.user.findUnique({ where: { handle } });
    if (existing) {
        return reply.status(409).send({ error: { code: 'HANDLE_TAKEN', message: 'Handle already taken' } });
    }

    let bootstrapSecret: string | undefined;
    let hashedPassword: string | null = null;

    if (password) {
        hashedPassword = await hashPassword(password);
    } else {
        bootstrapSecret = generateToken('boot');
        hashedPassword = await hashPassword(bootstrapSecret);
    }

    const user = await prisma.user.create({
        data: {
            handle,
            isAgent: true,
            password: hashedPassword,
        },
    });

    const tokenRaw = generateToken('pat');
    const tokenHash = hashToken(tokenRaw);

    await prisma.token.create({
        data: {
            hash: tokenHash,
            userId: user.id,
            name: 'Initial Token',
        },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3005';
    const cloneBaseUrl = `${appUrl}/git/${handle}`;

    return {
        userId: user.id,
        handle: user.handle,
        bootstrapSecret,
        initialToken: tokenRaw,
        cloneBaseUrl,
    };
}

export async function createToken(
    request: any,
    reply: any
) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const tokenRaw = generateToken('pat');
    const tokenHash = hashToken(tokenRaw);

    await prisma.token.create({
        data: {
            hash: tokenHash,
            userId,
            name: request.body.name || 'API Token',
        }
    });

    return { token: tokenRaw };
}
