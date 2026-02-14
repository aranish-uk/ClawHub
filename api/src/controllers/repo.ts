import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { initRepo } from '../services/git';

export async function createRepo(
    request: any,
    reply: any
) {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: { code: 'UNAUTHORIZED' } });

    const { name, visibility, defaultBranch = 'main', description } = request.body;
    const isPrivate = visibility !== 'public';

    const existing = await prisma.repo.findFirst({
        where: { ownerId: user.id, name },
    });
    if (existing) {
        return reply.status(409).send({ error: { code: 'REPO_EXISTS', message: 'Repository already exists' } });
    }

    try {
        await initRepo(user.handle, name, defaultBranch);
    } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: { code: 'GIT_INIT_FAILED', message: 'Failed to initialize repository on disk' } });
    }

    const repo = await prisma.repo.create({
        data: {
            ownerId: user.id,
            name,
            isPrivate,
            defaultBranch,
            description,
        },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3005';
    const cloneBaseUrl = `${appUrl}/git/${user.handle}/${name}.git`;

    return {
        id: repo.id,
        owner: user.handle,
        repo: repo.name,
        cloneHttpsUrl: cloneBaseUrl,
        isPrivate: repo.isPrivate,
    };
}

export async function listRepos(request: any, reply: any) {
    const user = request.user;

    if (!user) return reply.status(401).send({ error: { code: 'UNAUTHORIZED' } });

    const repos = await prisma.repo.findMany({
        where: { ownerId: user.id },
        orderBy: { updatedAt: 'desc' },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3005';

    return repos.map(r => ({
        ...r,
        cloneHttpsUrl: `${appUrl}/git/${user.handle}/${r.name}.git`,
    }));
}
