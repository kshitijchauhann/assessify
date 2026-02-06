'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserDashboard() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/user/assignments')
            .then((res) => res.json())
            .then((data) => {
                if (data.assignments) {
                    setAssignments(data.assignments);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center mt-20">Loading assignments...</div>;

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Assignments</h1>
                <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
                    Logout
                </Button>
            </div>

            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        No tests assigned to you yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignments.map((assign: any) => (
                        <Card key={assign.id}>
                            <CardHeader>
                                <CardTitle className="capitalize">{assign.domain.replace('-', ' ')} Test</CardTitle>
                                <CardDescription>Status: {assign.status}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {assign.status === 'pending' ? (
                                    <Link href={`/test/${assign.domain}`}>
                                        <Button className="w-full">Start Test</Button>
                                    </Link>
                                ) : (
                                    <Button variant="secondary" className="w-full" disabled>Completed</Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
