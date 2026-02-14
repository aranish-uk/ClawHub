import { createRepo, listRepos } from '../controllers/repo';
import { requireAuth } from '../middleware/auth';

export default async function repoRoutes(fastify: any) {
    fastify.post('/repos', { preHandler: requireAuth }, createRepo);
    fastify.get('/repos', { preHandler: requireAuth }, listRepos);
}
