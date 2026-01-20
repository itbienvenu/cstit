'use client';

import * as React from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

interface AdminAssignmentsProps {
    user: any;
}

export default function AdminAssignments({ user }: AdminAssignmentsProps) {
    const [assignments, setAssignments] = React.useState<any[]>([]);
    const [createOpen, setCreateOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);

    // Form State
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [deadline, setDeadline] = React.useState('');

    const [editingId, setEditingId] = React.useState<string | null>(null);

    const fetchAssignments = React.useCallback(async () => {
        if (!user?.organizationId) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/assignments?classId=${user.organizationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            }
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        }
    }, [user]);

    React.useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleCreate = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    classId: user.organizationId,
                    title,
                    description,
                    deadlineAt: new Date(deadline).toISOString()
                })
            });

            if (res.ok) {
                setCreateOpen(false);
                setTitle('');
                setDescription('');
                setDeadline('');
                fetchAssignments();
                alert('Assignment created successfully!');
            } else {
                alert('Failed to create assignment');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating assignment');
        }
    };

    const handleEditClick = (assignment: any) => {
        setEditingId(assignment.id);
        setTitle(assignment.title);
        setDescription(assignment.description);
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        const date = new Date(assignment.deadlineAt);
        const formatted = date.toISOString().slice(0, 16);
        setDeadline(formatted);
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/assignments/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    deadlineAt: new Date(deadline).toISOString()
                })
            });

            if (res.ok) {
                setEditOpen(false);
                setEditingId(null);
                fetchAssignments();
                alert('Assignment updated successfully!');
            } else {
                alert('Failed to update assignment');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating assignment');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Class Assignments</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setTitle('');
                        setDescription('');
                        setDeadline('');
                        setCreateOpen(true);
                    }}
                >
                    Create Assignment
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Deadline</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assignments.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{row.title}</TableCell>
                                <TableCell>{row.description}</TableCell>
                                <TableCell>{new Date(row.deadlineAt).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.status}
                                        color={row.status === 'OPEN' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEditClick(row)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {assignments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No assignments found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Deadline"
                        type="datetime-local"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth>
                <DialogTitle>Edit Assignment</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Deadline"
                        type="datetime-local"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdate} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
