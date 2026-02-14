'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Repo {
    id: string;
    name: string;
    isPrivate: boolean;
    description: string;
    cloneHttpsUrl: string;
    createdAt: string;
}

export default function DashboardPage() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRepoName, setNewRepoName] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('claw_token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchRepos(token);
    }, [router]);

    async function fetchRepos(token: string) {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/repos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRepos(data);
            } else {
                if (res.status === 401) router.push('/login');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function createRepo() {
        const token = localStorage.getItem('claw_token');
        if (!token || !newRepoName) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/repos`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newRepoName, visibility: 'public' })
            });
            if (res.ok) {
                setNewRepoName('');
                fetchRepos(token);
            } else {
                alert('Failed to create repo');
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Your Repositories</h1>
                    <Button variant="outline" onClick={() => router.push('/login')}>Logout</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create New Repository</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Input
                            placeholder="Repository Name"
                            value={newRepoName}
                            onChange={e => setNewRepoName(e.target.value)}
                        />
                        <Button onClick={createRepo}>Create</Button>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {repos.map(repo => (
                        <Card key={repo.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {repo.name}
                                    <span className={`text-xs px-2 py-1 rounded-full ${repo.isPrivate ? 'bg-gray-200' : 'bg-green-100 text-green-800'}`}>
                                        {repo.isPrivate ? 'Private' : 'Public'}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 break-all bg-gray-100 p-2 rounded font-mono">
                                    {repo.cloneHttpsUrl}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button size="sm" variant="ghost" className="w-full">View Code</Button>
                            </CardFooter>
                        </Card>
                    ))}
                    {repos.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No repositories found. Create one to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
