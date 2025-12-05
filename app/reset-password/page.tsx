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
    Link
} from '@mui/material';
import Navbar from '@/components/Navbar';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetPasswordForm() {
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [status, setStatus] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = React.useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    if (!token) {
        return <Alert severity="error">Invalid link. Token is missing.</Alert>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        if (password !== confirmPassword) {
            setStatus({ type: 'error', text: 'Passwords do not match' });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', text: 'Password reset successfully. Redirecting...' });
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setStatus({ type: 'error', text: data.error || 'Failed to reset password' });
            }
        } catch (error) {
            setStatus({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                Reset Password
            </Typography>

            {status && (
                <Alert severity={status.type} sx={{ width: '100%', mb: 2 }}>
                    {status.text}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="New Password"
                    type="password"
                    id="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading}
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
            </Box>
        </Paper>
    );
}

export default function ResetPasswordPage() {
    return (
        <main>
            <Navbar />
            <Container maxWidth="xs" sx={{ mt: 8 }}>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </Container>
        </main>
    );
}
