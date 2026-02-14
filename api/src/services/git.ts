import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export const REPO_ROOT = process.env.REPO_ROOT || './data/repos';

export async function initRepo(owner: string, repoName: string, defaultBranch: string = 'main') {
    const repoPath = path.join(REPO_ROOT, owner, `${repoName}.git`);

    // Ensure owner directory exists
    await fs.mkdir(path.join(REPO_ROOT, owner), { recursive: true });

    // Check if already exists
    try {
        await fs.access(repoPath);
        // If exists, maybe check if valid git repo? For now assume yes.
        return { path: repoPath, created: false };
    } catch {
        // Doesn't exist, create
    }

    // Init bare repo
    await execAsync(`git init --bare "${repoPath}"`);

    // Set default branch (HEAD)
    // git symbolic-ref HEAD refs/heads/main
    await execAsync(`git symbolic-ref HEAD refs/heads/${defaultBranch}`, { cwd: repoPath });

    // Enable http-backend
    await execAsync(`git config http.receivepack true`, { cwd: repoPath });

    return { path: repoPath, created: true };
}
