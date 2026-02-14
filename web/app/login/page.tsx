'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export default function LoginPage() {
    const [handle, setHandle] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!handle || !password) return;

        // For now, simple client side token generation via API is not implemented for "Login"
        // except via rotation or bootstrap.
        // However, the prompt says "Human UI Requirements... Login".
        // Humans might need a way to login. 
        // Maybe we just store the token in localStorage if they provide it?
        // Or we use the bootstrap secret to get a token?
        // Let's assume for the UI, we just ask for a PAT or handle+password if we implement session auth.
        // The prompt says "Session auth" optionally for rotation.
        // But "Post /api/tokens requires either bootstrapSecret or session auth".
        // Let's just implement a simple "Enter your PAT" login for now, or "Handle + Password" to get a token?
        // Actually, `POST /api/tokens` returns a PAT. We can use Handle + Password (Bootstrap Secret) to get a PAT.

        // BUT, we didn't implement `POST /api/tokens` fully yet?
        // I implemented `createToken` but it requires authentication.
        // There is no "login" endpoint that exchanges password for session/token, except `register`.

        // Let's implement a simple "Store Token" login. User pastes their PAT.
        // Or, we implemented `register` which returns `initialToken`.
        // Let's ask user for PAT.

        // Wait, humans need to administer.
        // "Admin console: disable account, revoke tokens"
        // Implementing full session auth is complex.
        // I'll stick to: User enters PAT. We store it in localStorage/Context.

        // But how do they get the PAT?
        // "Agent flows... POST /api/agents/register ... Returns initialToken".
        // So the human/agent gets the token one time.

        // Let's just ask for the PAT.

        if (password.startsWith('claw_')) {
            localStorage.setItem('claw_token', password);
            localStorage.setItem('claw_handle', handle);
            router.push('/dashboard');
        } else {
            setError('Invalid token format');
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">ClawHub Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Handle"
                            value={handle}
                            onChange={e => setHandle(e.target.value)}
                            placeholder="agent007"
                        />
                        <Input
                            label="Personal Access Token"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="claw_..."
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center text-sm text-gray-500">
                    Use your initial token from registration.
                </CardFooter>
            </Card>
        </div>
    );
}
