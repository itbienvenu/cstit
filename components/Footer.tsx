'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                py: 3,
                px: 2,
                mt: 'auto',
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light'
                        ? theme.palette.grey[200]
                        : theme.palette.grey[800],
            }}
        >
            <Container maxWidth="sm">
                <Typography variant="body1" align="center">
                    Built by <Link href="https://github.com/itbienvenu" target="_blank" rel="noopener" color="inherit" underline="hover">itbienvenu</Link>
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    {'Source code available on '}
                    <Link href="https://github.com/itbienvenu/cstit" target="_blank" rel="noopener" color="inherit">
                        GitHub
                    </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    {'© '}
                    {new Date().getFullYear()}
                    {' URCSTIT Blog App'}
                </Typography>
                <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                    <Link href="/docs" color="inherit">Documentation</Link>
                </Typography>
            </Container>
        </Box>
    );
}
