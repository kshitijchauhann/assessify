'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('results');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    // User Creation Form
    const [newUser, setNewUser] = useState({ name: '', email: '' });
    const [creatingUser, setCreatingUser] = useState(false);

    // Assignment Form
    const [assignment, setAssignment] = useState({ email: '', domain: '' });
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = () => {
        setLoading(true);
        fetch('/api/admin/results')
            .then((res) => res.json())
            .then((data) => setResults(data.results || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            const data = await res.json();
            if (res.ok) {
                alert('User created and credentials emailed!');
                setNewUser({ name: '', email: '' });
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error creating user');
        } finally {
            setCreatingUser(false);
        }
    };

    const handleAssignTest = async (e: React.FormEvent) => {
        e.preventDefault();
        setAssigning(true);
        try {
            const res = await fetch('/api/admin/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignment),
            });
            const data = await res.json();
            if (res.ok) {
                alert('Test assigned successfully!');
                setAssignment({ ...assignment, domain: '' });
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error assigning test');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <div className="space-x-4">
                    <Button variant={activeTab === 'results' ? 'default' : 'outline'} onClick={() => setActiveTab('results')}>Results</Button>
                    <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>Manage Users</Button>
                </div>
            </div>

            {activeTab === 'results' && (
                <Card>
                    <CardHeader>
                        <CardTitle>All Test Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="text-center py-4">Loading...</div> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Candidate</TableHead>
                                        <TableHead>Domain</TableHead>
                                        <TableHead>Correct</TableHead>
                                        <TableHead>Incorrect</TableHead>
                                        <TableHead>Left</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Percentage</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center">No results.</TableCell></TableRow>
                                    ) : results.map((r: any) => {
                                        const attempted = r.attempted ?? r.total_questions; // Fallback for old data
                                        const correct = r.score;
                                        const incorrect = attempted - correct;
                                        const left = r.total_questions - attempted;

                                        return (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.candidate_name}</TableCell>
                                                <TableCell>{r.domain}</TableCell>
                                                <TableCell className="text-green-600 font-medium">{correct}</TableCell>
                                                <TableCell className="text-red-500">{incorrect}</TableCell>
                                                <TableCell className="text-gray-500">{left}</TableCell>
                                                <TableCell>{r.total_questions}</TableCell>
                                                <TableCell>{Number(r.percentage).toFixed(2)}%</TableCell>
                                                <TableCell className="text-right">{new Date(r.submitted_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'users' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create User */}
                    <Card>
                        <CardHeader><CardTitle>Create New User</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <Input placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                                <Input type="email" placeholder="Email Address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                                <Button type="submit" disabled={creatingUser} className="w-full">
                                    {creatingUser ? 'Sending Credentials...' : 'Create User'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Assign Test */}
                    <Card>
                        <CardHeader><CardTitle>Assign Test</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleAssignTest} className="space-y-4">
                                <Input type="email" placeholder="User Email" value={assignment.email} onChange={e => setAssignment({ ...assignment, email: e.target.value })} required />
                                <Select value={assignment.domain} onValueChange={(val) => setAssignment({ ...assignment, domain: val })}>
                                    <SelectTrigger><SelectValue placeholder="Select Domain" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="business-analytics">Business Analytics</SelectItem>
                                        <SelectItem value="quality-assurance">Quality Assurance</SelectItem>
                                        <SelectItem value="data-engineering">Data Engineering</SelectItem>
                                        <SelectItem value="devops">DevOps</SelectItem>
                                        <SelectItem value="mern-stack">MERN Stack</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" disabled={assigning} className="w-full">
                                    {assigning ? 'Assigning...' : 'Assign Test'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
