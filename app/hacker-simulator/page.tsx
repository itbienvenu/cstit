'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const HACKER_CODE = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

// System Kernel Core
class SystemKernel {
private:
    string kernelVersion = "5.15.0-generic";
    bool rootAccess = false;

public:
    void initialize() {
        cout << "Initializing System Kernel v" << kernelVersion << "..." << endl;
        loadDrivers();
        checkMemory();
    }

    void loadDrivers() {
        cout << "[OK] Loading network drivers..." << endl;
        cout << "[OK] Loading storage drivers..." << endl;
        cout << "[OK] Loading graphics drivers..." << endl;
    }

    void checkMemory() {
        cout << "Checking system memory integrity..." << endl;
        for(int i=0; i<100; i++) {
            // Simulating memory check
        }
        cout << "[OK] Memory check passed." << endl;
    }

    bool grantRootAccess(string password) {
        if (password == "admin123") {
            rootAccess = true;
            return true;
        }
        return false;
    }
};

int main() {
    SystemKernel kernel;
    kernel.initialize();
    
    // Attempting brute force attack...
    // Injecting payload...
    // Bypassing firewall...
    
    return 0;
}

// Encryption Algorithm
void encryptData(string& data) {
    for (char& c : data) {
        c = c ^ 0xFF;
    }
}

// Network Socket Connection
void connectToSocket(string ip, int port) {
    cout << "Connecting to " << ip << ":" << port << "..." << endl;
    // Handshake protocol
}
`;

export default function HackerSimulator() {
    const [code, setCode] = useState('');
    const [accessGranted, setAccessGranted] = useState(false);
    const codeIndex = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                window.location.href = '/';
                return;
            }

            e.preventDefault();

            if (accessGranted) return;

            const chunkSize = 3; // Number of characters to add per keystroke
            const nextIndex = Math.min(codeIndex.current + chunkSize, HACKER_CODE.length);

            if (codeIndex.current < HACKER_CODE.length) {
                setCode(prev => prev + HACKER_CODE.slice(codeIndex.current, nextIndex));
                codeIndex.current = nextIndex;

                // Auto scroll to bottom
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
            } else {
                setAccessGranted(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [accessGranted]);

    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                bgcolor: 'black',
                color: '#00ff00',
                fontFamily: 'monospace',
                p: 4,
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999,
            }}
        >
            <Box
                ref={containerRef}
                sx={{
                    height: '100%',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { display: 'none' }
                }}
            >
                <Typography
                    variant="body1"
                    component="pre"
                    sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        fontSize: '1.2rem',
                        lineHeight: 1.5
                    }}
                >
                    {code}
                    <span className="blinking-cursor">_</span>
                </Typography>
            </Box>

            {accessGranted && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'rgba(0, 0, 0, 0.9)',
                        border: '2px solid #00ff00',
                        p: 4,
                        textAlign: 'center',
                        animation: 'pulse 1s infinite',
                        boxShadow: '0 0 50px #00ff00',
                    }}
                >
                    <Typography variant="h2" sx={{ color: '#00ff00', fontWeight: 'bold', mb: 2 }}>
                        ACCESS GRANTED
                    </Typography>
                    <Typography variant="h5">
                        System Breach Successful
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#aaa' }}>
                        Press ESC to exit
                    </Typography>
                </Box>
            )}

            <Box sx={{ position: 'absolute', bottom: 20, right: 20, opacity: 0.5 }}>
                <Typography variant="caption">
                    Start typing to hack... (ESC to exit)
                </Typography>
            </Box>
        </Box>
    );
}
