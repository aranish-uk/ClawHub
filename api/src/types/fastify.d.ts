import 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string;
            handle: string;
            isAgent: boolean;
        };
    }
}
