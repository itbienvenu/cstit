'use client';

import * as React from 'react';
import {
    Box,
    Container,
    Typography,
    Tab,
    Tabs,
    TextField,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function AdminDashboard() {
    const [value, setValue] = React.useState(0);
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [users, setUsers] = React.useState<any[]>([]);
    const [myPosts, setMyPosts] = React.useState<any[]>([]);
    const [editingPost, setEditingPost] = React.useState<any>(null);
    const [editTitle, setEditTitle] = React.useState('');
    const [editDescription, setEditDescription] = React.useState('');
    const router = useRouter();

    const fetchUsers = React.useCallback(async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setUsers(await res.json());
        }
    }, []);

    const fetchMyPosts = React.useCallback(async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/posts', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const allPosts = await res.json();
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const myOwnPosts = allPosts.filter((p: any) => p.authorName === user.name);
            setMyPosts(myOwnPosts);
        }
    }, []);

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!token || (user.role !== 'class_rep' && user.role !== 'super_admin')) {
            router.push('/login');
        } else {
            fetchUsers();
            fetchMyPosts();
        }
    }, [router, fetchUsers, fetchMyPosts]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, description }),
        });

        if (res.ok) {
            alert('Post created successfully');
            setTitle('');
            setDescription('');
            fetchMyPosts(); // Refresh my posts after creating a new one
        } else {
            alert('Failed to create post');
        }
    };

    const handleUserAction = async (id: string, action: 'confirm' | 'blacklist' | 'delete') => {
        const token = localStorage.getItem('token');
        let res;
        if (action === 'delete') {
            res = await fetch(`/api/users?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        } else {
            const updates: any = {};
            if (action === 'confirm') updates.isConfirmed = true;
            if (action === 'blacklist') updates.isBlacklisted = true;

            res = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ _id: id, ...updates }),
            });
        }

        if (res.ok) {
            fetchUsers();
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/posts?id=${postId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            fetchMyPosts();
        } else {
            alert('Failed to delete post');
        }
    };

    const openEditDialog = (post: any) => {
        setEditingPost(post);
        setEditTitle(post.title);
        setEditDescription(post.description);
    };

    const handleUpdatePost = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/posts', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                _id: editingPost._id,
                title: editTitle,
                description: editDescription,
            }),
        });

        if (res.ok) {
            setEditingPost(null);
            fetchMyPosts();
        } else {
            alert('Failed to update post');
        }
    };

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Admin Dashboard
                </Typography>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={handleChange} aria-label="admin tabs">
                        <Tab label="Create Announcement" />
                        <Tab label="Manage Users" />
                        <Tab label="My Posts" />
                    </Tabs>
                </Box>
                <CustomTabPanel value={value} index={0}>
                    <Paper sx={{ p: 3, maxWidth: 600 }}>
                        <Typography variant="h6" gutterBottom>
                            New Announcement
                        </Typography>
                        <Box component="form" onSubmit={handleCreatePost}>
                            <TextField
                                fullWidth
                                label="Title"
                                margin="normal"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                margin="normal"
                                multiline
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                                Publish
                            </Button>
                        </Box>
                    </Paper>
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>
                                            {user.isConfirmed ? (
                                                <Chip label="Confirmed" color="success" size="small" />
                                            ) : (
                                                <Chip label="Pending" color="warning" size="small" />
                                            )}
                                            {user.isBlacklisted && (
                                                <Chip label="Blacklisted" color="error" size="small" sx={{ ml: 1 }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!user.isConfirmed && (
                                                <IconButton onClick={() => handleUserAction(user._id, 'confirm')} color="success" title="Confirm">
                                                    <CheckIcon />
                                                </IconButton>
                                            )}
                                            <IconButton onClick={() => handleUserAction(user._id, 'blacklist')} color="warning" title="Blacklist">
                                                <BlockIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleUserAction(user._id, 'delete')} color="error" title="Delete">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CustomTabPanel>
                <CustomTabPanel value={value} index={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {myPosts.map((post) => (
                            <Paper key={post._id} sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">{post.title}</Typography>
                                    <Box>
                                        <IconButton onClick={() => openEditDialog(post)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDeletePost(post._id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </Typography>
                                <Typography paragraph>{post.description}</Typography>
                                <Typography variant="subtitle2" sx={{ mt: 2 }}>Comments:</Typography>
                                <AdminPostComments postId={post._id} />
                            </Paper>
                        ))}
                        {myPosts.length === 0 && (
                            <Typography>You haven't created any posts yet.</Typography>
                        )}
                    </Box>
                </CustomTabPanel>
            </Container>

            <Dialog open={Boolean(editingPost)} onClose={() => setEditingPost(null)} fullWidth maxWidth="sm">
                <DialogTitle>Edit Announcement</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Title"
                        margin="normal"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        margin="normal"
                        multiline
                        rows={4}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingPost(null)}>Cancel</Button>
                    <Button onClick={handleUpdatePost} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function AdminPostComments({ postId }: { postId: string }) {
    const [comments, setComments] = React.useState<any[]>([]);

    const fetchComments = React.useCallback(() => {
        fetch(`/api/comments?postId=${postId}`)
            .then(res => res.json())
            .then(data => setComments(data));
    }, [postId]);

    React.useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/comments?commentId=${commentId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) fetchComments();
    };

    if (comments.length === 0) return <Typography variant="body2" color="text.secondary">No comments.</Typography>;

    return (
        <Box sx={{ pl: 2, borderLeft: 2, borderColor: 'divider' }}>
            {comments.map((c) => (
                <Box key={c._id} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{c.authorName}: </Typography>
                        <Typography variant="body2" component="span">{c.content}</Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleDeleteComment(c._id)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}
        </Box>
    );
}
