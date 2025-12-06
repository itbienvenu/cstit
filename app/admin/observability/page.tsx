
'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import {
    Container, Grid, Card, CardContent, Typography, Box, Chip,
    Table, TableBody, TableCell, TableHead, TableRow, Paper,
    CircularProgress, IconButton, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { LogLevel, LogEntry, SystemStats } from '@/engines/Observability/types';
import { useRouter } from 'next/navigation';

export default function ObservabilityDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            // Fetch Stats
            const statsRes = await fetch('/api/observability?action=stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (statsRes.status === 401) throw new Error('Unauthorized');
            const statsData = await statsRes.json();
            setStats(statsData);

            // Fetch Logs
            const logsRes = await fetch('/api/observability', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const logsData = await logsRes.json();
            setLogs(logsData.logs || []);

            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to fetch system data. Ensure you are logged In as Admin.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const getLevelColor = (level: LogLevel) => {
        switch (level) {
            case LogLevel.CRITICAL: return 'error';
            case LogLevel.ERROR: return 'error';
            case LogLevel.WARN: return 'warning';
            default: return 'success';
        }
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box component="span" sx={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main', boxShadow: '0 0 10px #00ff00' }} />
                        System Observability
                    </Typography>
                    <IconButton onClick={fetchData} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {loading && !stats ? (
                    <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <Grid container spacing={3} mb={4}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{ bgcolor: 'background.paper', borderLeft: '4px solid #4caf50' }}>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>Total Logs</Typography>
                                        <Typography variant="h3">{stats?.totalLogs || 0}</Typography>
                                        <Box display="flex" alignItems="center" mt={1}>
                                            <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="caption" color="text.secondary">System Active</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{ bgcolor: 'background.paper', borderLeft: '4px solid #ff9800' }}>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>Warnings</Typography>
                                        <Typography variant="h3">{stats?.warningCount || 0}</Typography>
                                        <Box display="flex" alignItems="center" mt={1}>
                                            <WarningIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="caption" color="text.secondary">Require Attention</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{ bgcolor: 'background.paper', borderLeft: '4px solid #f44336' }}>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>Errors</Typography>
                                        <Typography variant="h3">{stats?.errorCount || 0}</Typography>
                                        <Box display="flex" alignItems="center" mt={1}>
                                            <ErrorIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="caption" color="text.secondary">Critical Failures</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Recent Logs Table */}
                        <Paper sx={{ width: '100%', overflow: 'hidden', border: '1px solid rgba(145,158,171,0.12)' }}>
                            <Box p={2} borderBottom="1px solid rgba(145,158,171,0.12)">
                                <Typography variant="h6">Live System Logs</Typography>
                            </Box>
                            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Timestamp</TableCell>
                                            <TableCell>Level</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Message</TableCell>
                                            <TableCell>Endpoint</TableCell>
                                            <TableCell>User</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {logs.map((log, index) => (
                                            <TableRow key={log._id || index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.level}
                                                        color={getLevelColor(log.level)}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 'bold' }}
                                                    />
                                                </TableCell>
                                                <TableCell>{log.type}</TableCell>
                                                <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {log.message}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>{log.endpoint || '-'}</TableCell>
                                                <TableCell>{log.userId || 'Anonymous'}</TableCell>
                                            </TableRow>
                                        ))}
                                        {logs.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">No logs found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Paper>
                    </>
                )}
            </Container>
        </>
    );
}
