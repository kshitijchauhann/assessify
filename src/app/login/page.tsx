'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // Need to install next-auth/react client side? 
// No, auth.ts is server side. We can use client side import if we wrapped app in SessionProvider.
// Or usage of 'next-auth/react' is standard for client components.

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                redirect: false,
                email: form.email,
                password: form.password,
            });

            if (res?.error) {
                setError('Invalid credentials');
            } else {
                // Successful login, redirect handled by checking session or we force refresh/redirect
                // Ideally should check user role where to redirect.
                // For now, redirect to home, middleware or landing page logic handles routing.
                router.refresh(); // Refresh to update server components
                router.push('/');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-sm shadow-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Image src="/assessifyLogo.svg" alt="Assessify Logo" width={120} height={32} className="h-8 w-auto" />
                    </div>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>Enter your credentials to access the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
