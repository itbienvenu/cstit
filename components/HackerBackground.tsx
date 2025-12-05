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
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [bubbles, setBubbles] = React.useState<any[]>([]);

    React.useEffect(() => {
        // Generate bubbles client-side only to avoid hydration mismatch
        const newBubbles = [...Array(6)].map(() => ({
            width: 100 + Math.random() * 100,
            height: 100 + Math.random() * 100,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            duration: 10 + Math.random() * 20
        }));
        setBubbles(newBubbles);
    }, []);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(0, 255, 0, 0.15)'; // Low opacity green
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = characters.charAt(Math.floor(Math.random() * characters.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

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
            {/* Matrix Rain Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.5,
                }}
            />

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
            {/* Floating Dashed Bubbles */}
            {bubbles.map((bubble, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        width: bubble.width,
                        height: bubble.height,
                        border: '2px dashed rgba(0, 255, 0, 0.2)',
                        borderRadius: '50%',
                        top: bubble.top,
                        left: bubble.left,
                        animation: `${float} ${bubble.duration}s infinite linear`,
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
