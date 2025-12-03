'use client';

import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
  100% { transform: translateY(0px) rotate(360deg); }
`;

const pulse = keyframes`
  0% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
  100% { opacity: 0.3; transform: scale(1); }
`;

export default function HackerBackground() {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                overflow: 'hidden',
                background: 'linear-gradient(to bottom, #050505, #0a0a0a)',
                pointerEvents: 'none',
            }}
        >
            {/* Grid Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `
            linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px)
          `,
                    backgroundSize: '30px 30px',
                }}
            />

            {/* Floating Dashed Bubbles */}
            {[...Array(6)].map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        width: 100 + Math.random() * 100,
                        height: 100 + Math.random() * 100,
                        border: '2px dashed rgba(0, 255, 0, 0.2)',
                        borderRadius: '50%',
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `${float} ${10 + Math.random() * 20}s infinite linear`,
                        boxShadow: '0 0 15px rgba(0, 255, 0, 0.1)',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '50%',
                            height: '50%',
                            transform: 'translate(-50%, -50%)',
                            border: '1px solid rgba(0, 255, 0, 0.1)',
                            borderRadius: '50%',
                        }
                    }}
                />
            ))}

            {/* Glowing Orbs */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(0, 255, 0, 0.05) 0%, transparent 70%)',
                    animation: `${pulse} 8s infinite ease-in-out`,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(0, 255, 255, 0.05) 0%, transparent 70%)',
                    animation: `${pulse} 12s infinite ease-in-out`,
                }}
            />
        </Box>
    );
}
