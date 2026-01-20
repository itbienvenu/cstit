'use client';

import * as React from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Avatar,
} from '@mui/material';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import StudentAssignmentList from '@/components/assignments/StudentAssignmentList';

export default function UserDashboard() {
    const [messages, setMessages] = React.useState<any[]>([]);
    const [user, setUser] = React.useState<any>(null);
    const router = useRouter();

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            router.push('/login');
        } else {
            setUser(JSON.parse(userData));
            fetch('/api/messages?type=sent', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setMessages(data));
        }
    }, [router]);

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    My Dashboard
                </Typography>

                <Box sx={{ mb: 6 }}>
                    <StudentAssignmentList />
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                    My Private Messages
                </Typography>
                <Grid container spacing={3}>
                    {messages.map((msg) => (
                        <Grid size={{ xs: 12, md: 6 }} key={msg._id}>
                            <Card sx={{ bgcolor: 'transparent', boxShadow: 'none', border: '1px solid rgba(145, 158, 171, 0.24)' }}>
                                <CardHeader
                                    avatar={
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>Me</Avatar>
                                    }
                                    title={`To: Class Rep (Re: ${msg.postTitle})`}
                                    subheader={new Date(msg.createdAt).toLocaleString()}
                                />
                                <CardContent>
                                    <Typography variant="body1">
                                        {msg.content}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.main' }}>
                                        🔒 Encrypted
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {messages.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    You haven't sent any private messages yet.
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Container>
        </>
    );
}
