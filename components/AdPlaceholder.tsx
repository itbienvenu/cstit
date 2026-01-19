import * as React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdPlaceholderProps {
    label: string;
    width?: string | number;
    height?: string | number;
    className?: string;
    mobileHidden?: boolean;
}

export default function AdPlaceholder({ label, width = '100%', height = 250, className, mobileHidden }: AdPlaceholderProps) {
    return (
        <Box
            className={className}
            sx={{
                width: width,
                height: height,
                my: 4,
                mx: 'auto',
                display: mobileHidden ? { xs: 'none', md: 'flex' } : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px dashed #ccc',
                backgroundColor: '#f9f9f9',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ textAlign: 'center', p: 2, color: '#999' }}>
                <Typography variant="h6" fontWeight="bold">AD SPACE</Typography>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="caption" display="block">{width} x {height}</Typography>
            </Box>
        </Box>
    );
}
