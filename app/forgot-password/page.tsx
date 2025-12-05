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

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState('');
    const [status, setStatus] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', text: data.message });
                setEmail('');
            } else {
                setStatus({ type: 'error', text: data.error || 'Something went wrong' });
            }
        } catch (error) {
            setStatus({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <Navbar />
            <Container maxWidth="xs" sx={{ mt: 8 }}>
                <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Forgot Password?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Enter your email address and we'll send you a link to reset your password.
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
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Link href="/login" variant="body2">
                                Back to Login
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </main>
    );
}
