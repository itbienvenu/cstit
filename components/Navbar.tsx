'use client';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [user, setUser] = React.useState<any>(null);
    const router = useRouter();

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        <Link href="/" style={{ color: 'inherit', textDecoration: 'none', fontFamily: 'monospace', fontWeight: 'bold' }}>
                            &gt;_ URCSTIT_BLOG
                        </Link>
                    </Typography>
                    {user ? (
                        <>
                            <Typography variant="body1" sx={{ mr: 2 }}>
                                Welcome, {user.name}
                            </Typography>
                            {(user.role === 'class_rep' || user.role === 'super_admin') && (
                                <Button color="inherit" component={Link} href="/admin">
                                    Dashboard
                                </Button>
                            )}
                            <Button color="inherit" onClick={handleLogout}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button color="inherit" component={Link} href="/login">
                                Login
                            </Button>
                            <Button color="inherit" component={Link} href="/register">
                                Register
                            </Button>
                        </>
                    )}
                </Toolbar>
            </AppBar>
        </Box>
    );
}
