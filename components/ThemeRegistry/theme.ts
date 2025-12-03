import { createTheme } from '@mui/material/styles';
import { Roboto_Mono } from 'next/font/google';

const robotoMono = Roboto_Mono({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00ff00', // Neon Green
        },
        secondary: {
            main: '#00ffff', // Cyan
        },
        background: {
            default: 'transparent', // Allow custom background to show
            paper: 'rgba(10, 10, 10, 0.7)', // Glassmorphism
        },
        text: {
            primary: '#e0e0e0',
            secondary: '#a0a0a0',
        },
        error: {
            main: '#ff3333',
        },
        success: {
            main: '#00ff00',
        },
    },
    typography: {
        fontFamily: robotoMono.style.fontFamily,
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.02em' },
        h3: { fontWeight: 700, letterSpacing: '-0.02em' },
        h4: { fontWeight: 700, letterSpacing: '-0.02em' },
        h5: { fontWeight: 700, letterSpacing: '-0.02em' },
        h6: { fontWeight: 700, letterSpacing: '-0.02em' },
        button: { fontWeight: 700, letterSpacing: '0.05em' },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: "#333 #0a0a0a",
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        backgroundColor: "#0a0a0a",
                        width: 8,
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        backgroundColor: "#333",
                        minHeight: 24,
                        border: "2px solid #0a0a0a",
                    },
                    "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
                        backgroundColor: "#555",
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0, // Sharper edges for tech feel
                    textTransform: 'uppercase',
                    border: '1px solid transparent',
                    '&:hover': {
                        border: '1px solid #00ff00',
                        boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
                    },
                },
                contained: {
                    backgroundColor: '#00aa00',
                    color: '#000',
                    '&:hover': {
                        backgroundColor: '#00ff00',
                    },
                },
                outlined: {
                    borderColor: '#00ff00',
                    color: '#00ff00',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 255, 0, 0.1)',
                    borderRadius: 4,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderBottom: '1px solid rgba(0, 255, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(0, 255, 0, 0.3)',
                        },
                        '&:hover fieldset': {
                            borderColor: '#00ff00',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#00ff00',
                            boxShadow: '0 0 5px rgba(0, 255, 0, 0.3)',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: '#a0a0a0',
                        '&.Mui-focused': {
                            color: '#00ff00',
                        },
                    },
                },
            },
        },
    },
});

export default theme;
