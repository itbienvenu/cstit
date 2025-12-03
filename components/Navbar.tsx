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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export default function Navbar() {
    const [user, setUser] = React.useState<any>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

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
                    {isMobile && (
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                            onClick={handleMenu}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        <Link href="/" style={{ color: 'inherit', textDecoration: 'none', fontFamily: 'monospace', fontWeight: 'bold' }}>
                            &gt;_ URCSTIT_BLOG<span className="blinking-cursor">_</span>
                        </Link>
                    </Typography>
                    {!isMobile && user ? (
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
                    ) : !isMobile && (
                        <>
                            <Button color="inherit" component={Link} href="/hacker-simulator" sx={{ mr: 2, border: '1px dashed #00ff00' }}>
                                BECOME_A_HACKER
                            </Button>
                            <Button color="inherit" component={Link} href="/login">
                                Login
                            </Button>
                            <Button color="inherit" component={Link} href="/register">
                                Register
                            </Button>
                        </>
                    )}

                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        {user ? [
                            <MenuItem key="welcome" disabled>
                                <Typography variant="body2">User: {user.name}</Typography>
                            </MenuItem>,
                            (user.role === 'class_rep' || user.role === 'super_admin') && (
                                <MenuItem key="dashboard" onClick={() => { handleClose(); router.push('/admin'); }}>
                                    Dashboard
                                </MenuItem>
                            ),
                            <MenuItem key="hacker" onClick={() => { handleClose(); router.push('/hacker-simulator'); }}>
                                BECOME A HACKER
                            </MenuItem>,
                            <MenuItem key="logout" onClick={() => { handleClose(); handleLogout(); }}>
                                Logout
                            </MenuItem>
                        ] : [
                            <MenuItem key="hacker" onClick={() => { handleClose(); router.push('/hacker-simulator'); }}>
                                BECOME A HACKER
                            </MenuItem>,
                            <MenuItem key="login" onClick={() => { handleClose(); router.push('/login'); }}>
                                Login
                            </MenuItem>,
                            <MenuItem key="register" onClick={() => { handleClose(); router.push('/register'); }}>
                                Register
                            </MenuItem>
                        ]}
                    </Menu>
                </Toolbar>
            </AppBar>
        </Box >
    );
}
