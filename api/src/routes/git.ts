import { handleGit, gitAuth } from '../controllers/git';

export default async function gitRoutes(fastify: any) {
    // Add parser to allow git content types without JSON parsing
    fastify.addContentTypeParser(/^application\/x-git-.*$/, (req: any, payload: any, done: any) => {
        done(null, payload);
    });

    const gitRegex = '\\/git\\/(?<owner>[^/]+)\\/(?<repo>[^/]+)(?<path>\\/.*)?';

    // Smart HTTP routes
    fastify.all('/git/:owner/:repo.git/*', { preHandler: gitAuth }, handleGit);
    fastify.all('/git/:owner/:repo/*', { preHandler: gitAuth }, handleGit);

    // Also catch root access if needed (usually handled by the above star)
}
