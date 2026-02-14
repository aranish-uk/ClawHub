import { FastifyReply, FastifyRequest } from 'fastify';
import { spawn } from 'child_process';
import path from 'path';
import { prisma } from '../lib/prisma';
import { hashToken } from '../utils/hash';

const REPO_ROOT = process.env.REPO_ROOT || '/data/repos';

export async function gitAuth(request: any, reply: any) {
    const header = request.headers.authorization;
    if (!header) {
        reply.header('WWW-Authenticate', 'Basic realm="ClawHub"');
        return reply.status(401).send('Unauthorized');
    }

    const [scheme, credentials] = header.split(' ');
    if (scheme !== 'Basic' || !credentials) {
        return reply.status(401).send('Invalid auth scheme');
    }

    const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

    const hashed = hashToken(password);
    const token = await prisma.token.findFirst({
        where: { hash: hashed },
        include: { user: true },
    });

    if (!token) return reply.status(401).send('Invalid credentials');

    request.user = token.user;
}

export async function handleGit(request: any, reply: any) {
    reply.hijack();
    const { owner, repo, '*': gitPath } = request.params;
    const method = request.method;
    const user = request.user;

    const repoName = repo.replace(/\.git$/, '');
    const repoRecord = await prisma.repo.findFirst({
        where: { owner: { handle: owner }, name: repoName },
        include: { owner: true }
    });

    if (!repoRecord) {
        reply.raw.statusCode = 404;
        reply.raw.end('Repository not found');
        return;
    }

    const isRead = method === 'GET' || (method === 'POST' && request.url.includes('git-upload-pack'));
    const isWrite = method === 'POST' && request.url.includes('git-receive-pack');

    if (isRead && !repoRecord.isPrivate) {
        // Public allowed
    } else {
        if (!user) {
            reply.raw.statusCode = 401;
            reply.raw.setHeader('WWW-Authenticate', 'Basic realm="ClawHub"');
            reply.raw.end('Unauthorized');
            return;
        }
        if (repoRecord.ownerId !== user.id) {
            reply.raw.statusCode = 403;
            reply.raw.end('Forbidden');
            return;
        }
    }

    const absoluteRepoRoot = path.resolve(process.cwd(), REPO_ROOT);

    const pathInfo = `/${owner}/${repo.endsWith('.git') ? repo : repo + '.git'}/${gitPath || ''}`;

    const env: NodeJS.ProcessEnv & { QUERY_STRING: string } = {
        ...process.env,
        GIT_PROJECT_ROOT: absoluteRepoRoot,
        GIT_HTTP_EXPORT_ALL: 'true',
        PATH_INFO: pathInfo,
        REMOTE_USER: user ? user.handle : 'anonymous',
        CONTENT_TYPE: request.headers['content-type'],
        REQUEST_METHOD: method,
        QUERY_STRING: request.url.split('?')[1] || '',
        GIT_PROTOCOL: request.headers['git-protocol'] as string,
    };

    const git = spawn('/usr/bin/git', ['http-backend'], {
        env,
    });

    git.on('error', (err) => {
        console.error('Git spawn error:', err);
        if (!reply.raw.headersSent) {
            reply.raw.statusCode = 500;
            reply.raw.end('Git backend error');
        }
    });

    git.stderr.on('data', (data) => {
        console.error(`[GitStderr] ${data}`);
    });

    request.raw.pipe(git.stdin);

    let headersSent = false;
    let headersBuffer = Buffer.alloc(0);

    git.stdout.on('data', (chunk: Buffer) => {
        if (headersSent) {
            reply.raw.write(chunk);
            return;
        }

        headersBuffer = Buffer.concat([headersBuffer, chunk]);

        let separatorIndex = headersBuffer.indexOf('\r\n\r\n');
        let separatorLen = 4;

        if (separatorIndex === -1) {
            separatorIndex = headersBuffer.indexOf('\n\n');
            separatorLen = 2;
        }

        if (separatorIndex !== -1) {
            const headersPart = headersBuffer.subarray(0, separatorIndex).toString();
            const bodyPart = headersBuffer.subarray(separatorIndex + separatorLen);

            const httpHeaders: Record<string, string> = {};
            let statusCode = 200;

            const lines = headersPart.split(/\r?\n/);
            lines.forEach((line: string) => {
                const colonIndex = line.indexOf(': ');
                if (colonIndex !== -1) {
                    const key = line.substring(0, colonIndex);
                    const value = line.substring(colonIndex + 2);
                    if (key.toLowerCase() === 'status') {
                        statusCode = parseInt(value.split(' ')[0]);
                    } else {
                        httpHeaders[key] = value;
                    }
                }
            });

            reply.raw.writeHead(statusCode, httpHeaders);

            headersSent = true;
            reply.raw.write(bodyPart);
        }
    });

    git.stdout.on('end', () => {
        if (!headersSent) {
            if (!reply.raw.headersSent) reply.raw.end();
        } else {
            reply.raw.end();
        }
    });
}
