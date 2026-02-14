import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { hashToken } from '../utils/hash';

export async function requireAuth(request: any, reply: any) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' } });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid authorization scheme' } });
    }

    // Token is "pat_..." or "boot_..."
    // We store hashed tokens.
    const hashed = hashToken(token);

    const tokenRecord = await prisma.token.findFirst({
        where: { hash: hashed },
        include: { user: true },
    });

    if (!tokenRecord) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }

    request.user = tokenRecord.user;
}
