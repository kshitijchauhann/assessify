'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('results'); // 'results' | 'users'
    const [results, setResults] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // User Creation Form
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', domain: '' });
    const [creatingUser, setCreatingUser] = useState(false);

    // Assignment Form
    const [assignment, setAssignment] = useState({ email: '' });
    const [assigning, setAssigning] = useState(false);

    // Edit User
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        if (activeTab === 'results') fetchResults();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab]);

    const fetchResults = () => {
        setLoading(true);
        fetch('/api/admin/results')
            .then((res) => res.json())
            .then((data) => setResults(data.results || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchUsers = () => {
        setLoading(true);
        fetch('/api/admin/users')
            .then((res) => res.json())
            .then((data) => setUsers(data.users || []))
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
                alert('User created successfully!');
                setNewUser({ name: '', email: '', password: '', domain: '' });
                fetchUsers(); // Refresh list if on keys tab, or valid for next visit
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
                alert(data.message || 'Test assigned successfully!');
                setAssignment({ email: '' });
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error assigning test');
        } finally {
            setAssigning(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingUser.name,
                    email: editingUser.email,
                    domain: editingUser.domain
                }),
            });
            if (res.ok) {
                alert('User updated');
                setIsEditOpen(false);
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure? This will delete the user and their results.')) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('User deleted');
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const domains = [
        "Business Analytics",
        "Quality Assurance",
        "Data Engineering",
        "DevOps",
        "MERN Stack"
    ];

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Image src="/assessifyLogo.svg" alt="Assessify Logo" width={120} height={32} className="h-8 w-auto" />
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                </div>
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
                                        const attempted = r.attempted ?? r.total_questions;
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
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Create User */}
                        <Card>
                            <CardHeader><CardTitle>Create New User</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <Input placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                                    <Input type="email" placeholder="Email Address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                                    <Input type="text" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                                    <Select value={newUser.domain} onValueChange={(val) => setNewUser({ ...newUser, domain: val })}>
                                        <SelectTrigger><SelectValue placeholder="Select Domain" /></SelectTrigger>
                                        <SelectContent>
                                            {domains.map(d => <SelectItem key={d} value={d.toLowerCase().replace(/ /g, '-')}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button type="submit" disabled={creatingUser} className="w-full">
                                        {creatingUser ? 'Creating...' : 'Create User'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Assign Test */}
                        <Card>
                            <CardHeader><CardTitle>Assign Test</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        Assigning a test will use the domain set in the user's profile.
                                    </p>
                                    <form onSubmit={handleAssignTest} className="space-y-4">
                                        <Input type="email" placeholder="User Email" value={assignment.email} onChange={e => setAssignment({ ...assignment, email: e.target.value })} required />
                                        <Button type="submit" disabled={assigning} className="w-full">
                                            {assigning ? 'Assigning...' : 'Assign Test'}
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* User List Table */}
                    <Card>
                        <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? <div className="text-center">Loading...</div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Domain</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((u: any) => (
                                            <TableRow key={u.id}>
                                                <TableCell>{u.name}</TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>{u.domain || '-'}</TableCell>
                                                <TableCell>{u.role}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => { setEditingUser(u); setIsEditOpen(true); }}>Edit</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u.id)}>Delete</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Edit Modal */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                            </DialogHeader>
                            {editingUser && (
                                <div className="space-y-4">
                                    <div className="grid w-full gap-1.5">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input id="edit-name" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                                    </div>
                                    <div className="grid w-full gap-1.5">
                                        <Label htmlFor="edit-email">Email</Label>
                                        <Input id="edit-email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                                    </div>
                                    <div className="grid w-full gap-1.5">
                                        <Label>Domain</Label>
                                        <Select value={editingUser.domain} onValueChange={(val) => setEditingUser({ ...editingUser, domain: val })}>
                                            <SelectTrigger><SelectValue placeholder="Select Domain" /></SelectTrigger>
                                            <SelectContent>
                                                {domains.map(d => <SelectItem key={d} value={d.toLowerCase().replace(/ /g, '-')}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                        <Button onClick={handleUpdateUser}>Save Changes</Button>
                                    </DialogFooter>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
}
