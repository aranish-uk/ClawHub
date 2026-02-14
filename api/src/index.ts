import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import authRoutes from './routes/auth';
import repoRoutes from './routes/repo';
import gitRoutes from './routes/git';

const fastify = Fastify({
    logger: true
});

fastify.register(cors, {
    origin: '*'
});

fastify.register(authRoutes, { prefix: '/api' });
fastify.register(repoRoutes, { prefix: '/api' });
fastify.register(gitRoutes, { prefix: '' });

fastify.get('/', async (request: any, reply: any) => {
    return { hello: 'world', app: 'ClawHub API' };
});

fastify.get('/health', async (request: any, reply: any) => {
    return { status: 'ok' };
});

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3005');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
