'use client';

import * as React from 'react';
import { Container, Typography, Box } from '@mui/material';
import Navbar from '@/components/Navbar';
import ChatSystem from '@/components/ChatSystem';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
    const router = useRouter();

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    Messages
                </Typography>
                <ChatSystem />
            </Container>
        </>
    );
}
