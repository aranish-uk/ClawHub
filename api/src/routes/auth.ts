import { registerAgent, createToken } from '../controllers/auth';
import { requireAuth } from '../middleware/auth';

export default async function authRoutes(fastify: any) {
    fastify.post('/agents/register', registerAgent);
    fastify.post('/tokens', { preHandler: requireAuth }, createToken);
}
