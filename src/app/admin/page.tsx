'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";
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
    const [activeTab, setActiveTab] = useState('results'); // 'results' | 'users' | 'upload' | 'tests'
    const [results, setResults] = useState([]);
    const [users, setUsers] = useState([]);
    const [tests, setTests] = useState([]);
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

    // Upload Questions Form
    const [uploadDomain, setUploadDomain] = useState('');
    const [marks, setMarks] = useState(1);
    const [negativeMarking, setNegativeMarking] = useState(false);
    const [negativeMarks, setNegativeMarks] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [assignToAll, setAssignToAll] = useState(false);
    const [assignToAllDomains, setAssignToAllDomains] = useState(false);
    const [duration, setDuration] = useState(30);


    useEffect(() => {
        if (activeTab === 'results') fetchResults();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'tests') fetchTests();
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

    const fetchTests = () => {
        setLoading(true);
        fetch('/api/admin/tests')
            .then((res) => res.json())
            .then((data) => setTests(data.tests || []))
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

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !uploadDomain) {
            alert("Please select a file and a domain.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('domain', uploadDomain);
        formData.append('marks', marks.toString());
        formData.append('negativeMarking', negativeMarking.toString());
        formData.append('negativeMarks', negativeMarks.toString());
        formData.append('assignToAll', assignToAll.toString());
        formData.append('assignToAllDomains', assignToAllDomains.toString());
        formData.append('duration', duration.toString());

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setFile(null);
                // Optional: reset other fields
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Upload failed.');
        } finally {
            setUploading(false);
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
                    <Button variant={activeTab === 'tests' ? 'default' : 'outline'} onClick={() => setActiveTab('tests')}>Tests</Button>
                    <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>Manage Users</Button>
                    <Button variant={activeTab === 'upload' ? 'default' : 'outline'} onClick={() => setActiveTab('upload')}>Upload Questions</Button>
                    <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/login' })}>Logout</Button>
                </div>
            </div>

            {activeTab === 'tests' && (
                <Card>
                    <CardHeader>
                        <CardTitle>All Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="text-center py-4">Loading...</div> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Domain</TableHead>
                                        <TableHead>Questions Count</TableHead>
                                        <TableHead>Duration (mins)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tests.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center">No tests found.</TableCell></TableRow>
                                    ) : tests.map((t: any) => (
                                        <TableRow key={t.domain}>
                                            <TableCell className="font-medium">{t.domain}</TableCell>
                                            <TableCell>{t.question_count}</TableCell>
                                            <TableCell>{t.duration}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

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
                    </div> {/* End grid */}

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

            {/* Upload Questions Form */}
            {
                activeTab === 'upload' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Questions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
                                <div className="space-y-2">
                                    <Label>Select Domain</Label>
                                    <Select value={uploadDomain} onValueChange={(val) => { setUploadDomain(val); setAssignToAll(false); setAssignToAllDomains(false); }}>
                                        <SelectTrigger><SelectValue placeholder="Select Domain" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="common">Common</SelectItem>
                                            {domains.map(d => <SelectItem key={d} value={d.toLowerCase().replace(/ /g, '-')}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Marks per Question</Label>
                                    <Input type="number" min="1" value={marks} onChange={(e) => setMarks(parseInt(e.target.value))} />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="negative-marking"
                                        checked={negativeMarking}
                                        onChange={(e) => setNegativeMarking(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="negative-marking">Enable Negative Marking</Label>
                                </div>

                                {negativeMarking && (
                                    <div className="space-y-2">
                                        <Label>Negative Marks</Label>
                                        <Input type="number" step="0.1" min="0" value={negativeMarks} onChange={(e) => setNegativeMarks(parseFloat(e.target.value))} />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Time to complete (minutes)</Label>
                                    <Input type="number" min="1" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Upload Excel File (.xlsx)</Label>
                                    <Input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                                    <p className="text-sm text-gray-500">Format: Question, Option1, Option2, Option3, Option4, CorrectAnswerIndex (0-3)</p>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    {uploadDomain !== 'common' && (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="assign-to-all"
                                                checked={assignToAll}
                                                onChange={(e) => {
                                                    setAssignToAll(e.target.checked);
                                                    if (e.target.checked) setAssignToAllDomains(false);
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Label htmlFor="assign-to-all">Auto-assign to users of this domain</Label>
                                        </div>
                                    )}

                                    {uploadDomain === 'common' && (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="assign-to-all-domains"
                                                checked={assignToAllDomains}
                                                onChange={(e) => {
                                                    setAssignToAllDomains(e.target.checked);
                                                    if (e.target.checked) setAssignToAll(false);
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Label htmlFor="assign-to-all-domains">Assign to ALL users (all domains)</Label>
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Upload Questions'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
        </div>
    );
}
