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
    const [submissionMethod, setSubmissionMethod] = React.useState('LINK');
    const [submissionLink, setSubmissionLink] = React.useState('');

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
                    deadlineAt: new Date(deadline).toISOString(),
                    submissionMethod,
                    submissionLink: submissionMethod === 'LINK' ? submissionLink : undefined
                })
            });

            if (res.ok) {
                setCreateOpen(false);
                setTitle('');
                setDescription('');
                setDeadline('');
                setSubmissionLink('');
                setSubmissionMethod('LINK');
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
        setSubmissionMethod(assignment.submissionMethod || 'LINK');
        setSubmissionLink(assignment.submissionLink || '');
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
                    deadlineAt: new Date(deadline).toISOString(),
                    submissionMethod,
                    submissionLink: submissionMethod === 'LINK' ? submissionLink : undefined
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
                        setSubmissionLink('');
                        setSubmissionMethod('LINK');
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
                            <TableCell>Submission Method</TableCell>
                            <TableCell>Submission Link</TableCell>
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
                                    <Chip label={row.submissionMethod || 'LINK'} size="small" />
                                </TableCell>
                                <TableCell>
                                    {row.submissionMethod === 'LINK' && row.submissionLink ? (
                                        <a href={row.submissionLink} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>
                                            Visit Link
                                        </a>
                                    ) : row.submissionMethod === 'FILE' ? (
                                        'Direct Upload'
                                    ) : (
                                        'N/A'
                                    )}
                                </TableCell>
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
                                <TableCell colSpan={7} align="center">
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

                    <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2">Submission Method</Typography>
                        <select
                            value={submissionMethod}
                            onChange={(e) => setSubmissionMethod(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginTop: '5px',
                                borderRadius: '4px',
                                border: '1px solid #ccc'
                            }}
                        >
                            <option value="LINK">External Link (Google Form, Drive, Dropbox)</option>
                            <option value="FILE">File Upload (Direct to System)</option>
                        </select>
                    </Box>

                    {submissionMethod === 'LINK' && (
                        <TextField
                            margin="dense"
                            label="Submission Link (Google Drive / Form / Dropbox)"
                            fullWidth
                            placeholder="e.g., https://forms.google.com/..."
                            value={submissionLink}
                            onChange={(e) => setSubmissionLink(e.target.value)}
                        />
                    )}
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

                    <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2">Submission Method</Typography>
                        <select
                            value={submissionMethod}
                            onChange={(e) => setSubmissionMethod(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginTop: '5px',
                                borderRadius: '4px',
                                border: '1px solid #ccc'
                            }}
                        >
                            <option value="LINK">External Link (Google Form, Drive, Dropbox)</option>
                            <option value="FILE">File Upload (Direct to System)</option>
                        </select>
                    </Box>

                    {submissionMethod === 'LINK' && (
                        <TextField
                            margin="dense"
                            label="Submission Link (Google Drive / Form / Dropbox)"
                            fullWidth
                            placeholder="e.g., https://forms.google.com/..."
                            value={submissionLink}
                            onChange={(e) => setSubmissionLink(e.target.value)}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdate} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
