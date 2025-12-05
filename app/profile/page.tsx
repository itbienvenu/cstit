'use client';

import * as React from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    Avatar,
    Divider
} from '@mui/material';
import Navbar from '@/components/Navbar';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';

export default function ProfilePage() {
    const [user, setUser] = React.useState<any>(null);
    const [name, setName] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setName(parsedUser.name);
        } else {
            window.location.href = '/login';
        }
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    password: password || undefined
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                localStorage.setItem('user', JSON.stringify({ ...user, name: data.user.name }));
                setUser({ ...user, name: data.user.name });
                setPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        }
    };

    if (!user) return null;

    return (
        <main>
            <Navbar />
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 1 }}>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                            <PersonIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h5">{user.email}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                            {user.role} | {user.organizationId ? 'Class Member' : 'Admin'}
                        </Typography>
                    </Box>

                    <Divider />

                    <form onSubmit={handleUpdateProfile}>
                        {message && (
                            <Alert severity={message.type} sx={{ mb: 2 }}>
                                {message.text}
                            </Alert>
                        )}

                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" /> Basic Info
                        </Typography>
                        <TextField
                            fullWidth
                            label="Display Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            margin="normal"
                            required
                        />

                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LockIcon fontSize="small" /> Change Password
                            </Typography>
                            <Typography variant="caption" color="text.secondary" paragraph>
                                Leave blank to keep current password.
                            </Typography>
                            <TextField
                                fullWidth
                                label="New Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                margin="normal"
                            />
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            sx={{ mt: 4 }}
                        >
                            Save Changes
                        </Button>
                    </form>
                </Paper>
            </Container>
        </main>
    );
}
