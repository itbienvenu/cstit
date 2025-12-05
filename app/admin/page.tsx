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
    Snackbar,
    Alert,
    Autocomplete,
    Checkbox,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

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
    const [selectedUsers, setSelectedUsers] = React.useState<any[]>([]);
    const [myPosts, setMyPosts] = React.useState<any[]>([]);
    const [editingPost, setEditingPost] = React.useState<any>(null);
    const [editTitle, setEditTitle] = React.useState('');
    const [editDescription, setEditDescription] = React.useState('');
    const [currentUser, setCurrentUser] = React.useState<any>(null);

    // Create Class State
    const [className, setClassName] = React.useState('');
    const [classCode, setClassCode] = React.useState('');
    const [repName, setRepName] = React.useState('');
    const [repEmail, setRepEmail] = React.useState('');
    const [repPassword, setRepPassword] = React.useState('');

    // Undo / Snackbar State
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState('');
    const [undoAction, setUndoAction] = React.useState<(() => void) | null>(null);
    const pendingActionRef = React.useRef<NodeJS.Timeout | null>(null);

    // Blacklist Dialog State
    const [blacklistDialogOpen, setBlacklistDialogOpen] = React.useState(false);
    const [blacklistReason, setBlacklistReason] = React.useState('');
    const [userToBlacklist, setUserToBlacklist] = React.useState<string | null>(null);

    const router = useRouter();

    const fetchUsers = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                console.error('Failed to fetch users:', res.status, res.statusText);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
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
            setCurrentUser(user);
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
            body: JSON.stringify({
                title,
                description,
                notifyUserIds: selectedUsers.map(u => u._id)
            }),
        });

        if (res.ok) {
            alert('Post created successfully');
            setTitle('');
            setDescription('');
            setSelectedUsers([]);
            fetchMyPosts(); // Refresh my posts after creating a new one
        } else {
            alert('Failed to create post');
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('/api/admin/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    className,
                    classCode,
                    repName,
                    repEmail,
                    repPassword
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert('Class & Class Rep created successfully!');
                setClassName('');
                setClassCode('');
                setRepName('');
                setRepEmail('');
                setRepPassword('');
            } else {
                alert(data.error || 'Failed to create class');
            }
        } catch (error) {
            alert('An error occurred');
        }
    };

    const handleUserAction = async (id: string, action: 'confirm' | 'blacklist' | 'delete' | 'unblacklist', reason?: string) => {
        if (action === 'blacklist' && !reason) {
            setUserToBlacklist(id);
            setBlacklistReason('');
            setBlacklistDialogOpen(true);
            return;
        }

        const executeAction = async () => {
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
                if (action === 'blacklist') {
                    updates.isBlacklisted = true;
                    updates.reason = reason;
                }
                if (action === 'unblacklist') updates.isBlacklisted = false;

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

        if (action === 'blacklist') {
            // Delayed execution for blacklist
            setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlacklisted: true } : u)); // Optimistic update
            setSnackbarMessage('User blacklisted. Undo?');
            setUndoAction(() => () => {
                if (pendingActionRef.current) clearTimeout(pendingActionRef.current);
                fetchUsers(); // Revert optimistic update
                setSnackbarOpen(false);
            });
            setSnackbarOpen(true);

            pendingActionRef.current = setTimeout(() => {
                executeAction();
            }, 5000);
        } else if (action === 'unblacklist') {
            await executeAction();
            alert('User unblacklisted and notified.');
        } else {
            await executeAction();
        }
    };

    const confirmBlacklist = () => {
        if (userToBlacklist) {
            handleUserAction(userToBlacklist, 'blacklist', blacklistReason);
            setBlacklistDialogOpen(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        // Optimistic update
        const postToDelete = myPosts.find(p => p._id === postId);
        setMyPosts(prev => prev.filter(p => p._id !== postId));

        setSnackbarMessage('Post deleted. Undo?');
        setUndoAction(() => () => {
            if (pendingActionRef.current) clearTimeout(pendingActionRef.current);
            if (postToDelete) setMyPosts(prev => [postToDelete, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setSnackbarOpen(false);
        });
        setSnackbarOpen(true);

        pendingActionRef.current = setTimeout(async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/posts?id=${postId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                alert('Failed to delete post');
                fetchMyPosts(); // Revert if failed
            }
        }, 5000);
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
                    <Tabs value={value} onChange={handleChange} aria-label="admin tabs" scrollButtons="auto" variant="scrollable">
                        <Tab label="Create Announcement" />
                        <Tab label="Manage Users" />
                        <Tab label="My Posts" />
                        <Tab label="Messages" />
                        {currentUser?.role === 'super_admin' && <Tab label="Create Class" />}
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
                            <Autocomplete
                                multiple
                                id="checkboxes-tags-demo"
                                options={users}
                                disableCloseOnSelect
                                getOptionLabel={(option) => `${option.name} (${option.email})`}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props}>
                                        <Checkbox
                                            icon={icon}
                                            checkedIcon={checkedIcon}
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {option.name} ({option.email})
                                    </li>
                                )}
                                fullWidth
                                renderInput={(params) => (
                                    <TextField {...params} label="Notify Users via Email" placeholder="Select users" margin="normal" />
                                )}
                                value={selectedUsers}
                                onChange={(event, newValue) => {
                                    setSelectedUsers(newValue);
                                }}
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
                                                <Chip label={user.status || "Pending"} color={user.status === 'active' ? 'success' : 'warning'} size="small" />
                                            )}
                                            {user.isBlacklisted && (
                                                <Chip label="Blacklisted" color="error" size="small" sx={{ ml: 1 }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {(!user.isConfirmed && user.status !== 'active') && (
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
                                            {user.isBlacklisted && (
                                                <IconButton onClick={() => handleUserAction(user._id, 'unblacklist')} color="info" title="Unblacklist">
                                                    <RestoreIcon />
                                                </IconButton>
                                            )}
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
                <CustomTabPanel value={value} index={3}>
                    <AdminMessages />
                </CustomTabPanel>
                {currentUser?.role === 'super_admin' && (
                    <CustomTabPanel value={value} index={4}>
                        <SuperAdminClasses user={currentUser} />
                    </CustomTabPanel>
                )}
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

            <Dialog open={blacklistDialogOpen} onClose={() => setBlacklistDialogOpen(false)}>
                <DialogTitle>Blacklist User</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Reason for blacklisting"
                        fullWidth
                        variant="standard"
                        value={blacklistReason}
                        onChange={(e) => setBlacklistReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBlacklistDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmBlacklist} color="error">Blacklist</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={(event, reason) => {
                    if (reason === 'clickaway') return;
                    setSnackbarOpen(false);
                }}
                message={snackbarMessage}
                action={
                    <Button color="secondary" size="small" onClick={() => {
                        if (undoAction) undoAction();
                    }}>
                        UNDO
                    </Button>
                }
            />

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

function AdminMessages() {
    const [messages, setMessages] = React.useState<any[]>([]);

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('/api/messages?type=received', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setMessages(data));
    }, []);



    return (

        <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 2 }}>
            {messages.map((msg) => (
                <Paper
                    key={msg._id}
                    sx={{
                        p: 2,
                        mb: 2,
                        breakInside: 'avoid',
                        backgroundColor: 'transparent',
                        borderRadius: 2,
                        position: 'relative',
                        border: '1px solid rgba(145, 158, 171, 0.24)'
                    }}
                    elevation={0}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        From: {msg.senderName}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                        Re: {msg.postTitle}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'right', opacity: 0.7 }}>
                        {new Date(msg.createdAt).toLocaleString()}
                    </Typography>
                </Paper>
            ))}
            {messages.length === 0 && (
                <Typography>No private messages received.</Typography>
            )}
        </Box>
    );
}

function SuperAdminClasses({ user }: { user: any }) {
    const [classes, setClasses] = React.useState<any[]>([]);

    // Create State
    const [className, setClassName] = React.useState('');
    const [classCode, setClassCode] = React.useState('');
    const [repName, setRepName] = React.useState('');
    const [repEmail, setRepEmail] = React.useState('');
    const [repPassword, setRepPassword] = React.useState('');

    // Edit State
    const [editingClass, setEditingClass] = React.useState<any>(null);
    const [editName, setEditName] = React.useState('');
    const [editCode, setEditCode] = React.useState('');

    const fetchClasses = React.useCallback(async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/classes', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            setClasses(await res.json());
        }
    }, []);

    React.useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('/api/admin/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ className, classCode, repName, repEmail, repPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                alert('Class & Class Rep created successfully!');
                setClassName(''); setClassCode(''); setRepName(''); setRepEmail(''); setRepPassword('');
                fetchClasses();
            } else {
                alert(data.error || 'Failed to create class');
            }
        } catch (error) {
            alert('An error occurred');
        }
    };

    const handleUpdateClass = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/classes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ _id: editingClass._id, name: editName, code: editCode }),
        });
        if (res.ok) {
            setEditingClass(null);
            fetchClasses();
        } else {
            alert('Failed to update');
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm('Are you sure? This will delete the class. Users may become orphaned.')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/classes?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            fetchClasses();
        } else {
            alert('Failed to delete');
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 4, maxWidth: '100%' }}>
                <Typography variant="h6" gutterBottom>Existing Classes</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Code</TableCell>
                                <TableCell>Members</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {classes.map((c) => (
                                <TableRow key={c._id}>
                                    <TableCell>{c.name}</TableCell>
                                    <TableCell><Chip label={c.code} size="small" /></TableCell>
                                    <TableCell>{c.memberCount || 0}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="primary" onClick={() => {
                                            setEditingClass(c);
                                            setEditName(c.name);
                                            setEditCode(c.code);
                                        }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteClass(c._id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper sx={{ p: 3, maxWidth: 600 }}>
                <Typography variant="h6" gutterBottom>Create New Class</Typography>
                <Box component="form" onSubmit={handleCreateClass}>
                    <TextField fullWidth label="Class Name" margin="normal" value={className} onChange={(e) => setClassName(e.target.value)} required />
                    <TextField fullWidth label="Class Code" margin="normal" value={classCode} onChange={(e) => setClassCode(e.target.value)} required />
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>First Class Rep</Typography>
                    <TextField fullWidth label="Rep Name" margin="normal" size="small" value={repName} onChange={(e) => setRepName(e.target.value)} required />
                    <TextField fullWidth label="Rep Email" margin="normal" size="small" type="email" value={repEmail} onChange={(e) => setRepEmail(e.target.value)} required />
                    <TextField fullWidth label="Rep Password" margin="normal" size="small" type="password" value={repPassword} onChange={(e) => setRepPassword(e.target.value)} required />
                    <Button type="submit" variant="contained" color="secondary" sx={{ mt: 3 }}>Create Class</Button>
                </Box>
            </Paper>

            <Dialog open={Boolean(editingClass)} onClose={() => setEditingClass(null)}>
                <DialogTitle>Edit Class</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Class Name" fullWidth value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <TextField margin="dense" label="Class Code" fullWidth value={editCode} onChange={(e) => setEditCode(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingClass(null)}>Cancel</Button>
                    <Button onClick={handleUpdateClass} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
