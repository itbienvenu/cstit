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
    Alert,
    Tabs,
    Tab,
    Skeleton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import TableSkeleton from '../skeletons/TableSkeleton';

interface AdminAssignmentsProps {
    user: any;
}

export default function AdminAssignments({ user }: AdminAssignmentsProps) {
    const [assignments, setAssignments] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [createOpen, setCreateOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [resubmissionRequests, setResubmissionRequests] = React.useState<any[]>([]);
    const [submissions, setSubmissions] = React.useState<any[]>([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState<number>(0);
    const [submissionsLoading, setSubmissionsLoading] = React.useState(false);
    const [resubmissionsLoading, setResubmissionsLoading] = React.useState(false);

    // Form State
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [deadline, setDeadline] = React.useState('');
    const [submissionMethod, setSubmissionMethod] = React.useState('LINK');
    const [submissionLink, setSubmissionLink] = React.useState('');

    const [editingId, setEditingId] = React.useState<string | null>(null);

    // Super Admin Context
    const [targetClassId, setTargetClassId] = React.useState(user?.organizationId || '');

    React.useEffect(() => {
        if (user?.organizationId) {
            setTargetClassId(user.organizationId);
        }
    }, [user]);

    const fetchAssignments = React.useCallback(async () => {
        if (!targetClassId) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/assignments?classId=${targetClassId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            } else {
                setAssignments([]);
            }
        } catch (error) {
            console.error("Failed to fetch assignments", error);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [targetClassId]);

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
                    classId: targetClassId,
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

    const fetchResubmissionRequests = React.useCallback(async (assignmentId: string) => {
        setResubmissionsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/assignments/${assignmentId}/resubmission-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setResubmissionRequests(data.requests || []);
            } else {
                setResubmissionRequests([]);
            }
        } catch (error) {
            console.error("Failed to fetch resubmission requests", error);
        } finally {
            setResubmissionsLoading(false);
        }
    }, []);

    const fetchSubmissions = React.useCallback(async (assignmentId: string) => {
        setSubmissionsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSubmissions(data.submissions || []);
            } else {
                setSubmissions([]);
            }
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setSubmissionsLoading(false);
        }
    }, []);

    const handleViewRequests = (assignmentId: string) => {
        setSelectedAssignmentId(assignmentId);
        setActiveTab(0); // Reset to first tab
        fetchSubmissions(assignmentId);
        fetchResubmissionRequests(assignmentId);
    };

    const handleApproveReject = async (submissionId: string, action: 'approve' | 'reject') => {
        let reason = '';
        if (action === 'reject') {
            reason = window.prompt("Enter rejection reason (optional):") || '';
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/submissions/${submissionId}/resubmission`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action, reason })
            });

            if (res.ok) {
                alert(`Resubmission request ${action}d successfully!`);
                if (selectedAssignmentId) {
                    fetchResubmissionRequests(selectedAssignmentId);
                }
            } else {
                const data = await res.json();
                alert(data.message || `Failed to ${action} request`);
            }
        } catch (error) {
            console.error(error);
            alert(`Error ${action}ing request`);
        }
    };

    const handleDelete = async (assignmentId: string) => {
        if (!window.confirm("Are you sure you want to delete this assignment? It will be archived but not permanently removed.")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/assignments/${assignmentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                fetchAssignments();
                alert('Assignment deleted successfully!');
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete assignment');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting assignment');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">Class Assignments</Typography>
                    {user?.role === 'super_admin' && (
                        <TextField
                            label="Target Class ID"
                            size="small"
                            value={targetClassId}
                            onChange={(e) => setTargetClassId(e.target.value)}
                            sx={{ width: 250 }}
                            placeholder="Enter Class/Org ID to manage"
                        />
                    )}
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        if (!targetClassId) {
                            alert("Please enter a Target Class ID first.");
                            return;
                        }
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
                        {loading ? (
                            Array.from(new Array(5)).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                                    <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                    <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Skeleton variant="circular" width={24} height={24} />
                                            <Skeleton variant="circular" width={24} height={24} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            assignments.map((row) => (
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
                                        <IconButton onClick={() => handleDelete(row.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                        {row.submissionMethod === 'FILE' && (
                                            <IconButton onClick={() => handleViewRequests(row.id)} color="secondary">
                                                <VisibilityIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        {!loading && assignments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No assignments found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Resubmission Requests Section */}
            {/* Tabbed Assignment Details Section */}
            {selectedAssignmentId && (
                <Box sx={{ mt: 4, mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Assignment Details</Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                setSelectedAssignmentId(null);
                                setResubmissionRequests([]);
                                setSubmissions([]);
                            }}
                        >
                            Close
                        </Button>
                    </Box>

                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} aria-label="assignment details tabs">
                            <Tab label={`Submissions (${submissions.length})`} />
                            <Tab label={`Resubmission Requests (${resubmissionRequests.length})`} />
                        </Tabs>
                    </Box>

                    {/* Tab 0: Submissions List */}
                    {activeTab === 0 && (
                        <>
                            <>
                                {submissionsLoading ? (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Student</TableCell>
                                                    <TableCell>Email</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Submitted At</TableCell>
                                                    <TableCell>File</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableSkeleton columns={5} />
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : submissions.length === 0 ? (
                                    <Alert severity="info">No submissions found for this assignment.</Alert>
                                ) : (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Student</TableCell>
                                                    <TableCell>Email</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Submitted At</TableCell>
                                                    <TableCell>File</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {submissions.map((sub: any) => (
                                                    <TableRow key={sub.id}>
                                                        <TableCell>{sub.student?.name || 'Unknown'}</TableCell>
                                                        <TableCell>{sub.student?.email || 'Unknown'}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={sub.resubmissionRequested ? "Resubmission Requested" : "Submitted"}
                                                                color={sub.resubmissionRequested ? "warning" : "success"}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>{new Date(sub.submittedAt).toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                View File
                                                            </a>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </>
                        </>
                    )}

                    {/* Tab 1: Resubmission Requests */}
                    {activeTab === 1 && (
                        <>
                            <>
                                {resubmissionsLoading ? (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Student Name</TableCell>
                                                    <TableCell>Student Email</TableCell>
                                                    <TableCell>Reason</TableCell>
                                                    <TableCell>Requested At</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableSkeleton columns={5} />
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : resubmissionRequests.length === 0 ? (
                                    <Alert severity="info">No pending resubmission requests for this assignment.</Alert>
                                ) : (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Student Name</TableCell>
                                                    <TableCell>Student Email</TableCell>
                                                    <TableCell>Reason</TableCell>
                                                    <TableCell>Requested At</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {resubmissionRequests.map((request) => (
                                                    <TableRow key={request.id}>
                                                        <TableCell>{request.student?.name || 'Unknown'}</TableCell>
                                                        <TableCell>{request.student?.email || 'Unknown'}</TableCell>
                                                        <TableCell>{request.resubmissionReason || 'No reason provided'}</TableCell>
                                                        <TableCell>
                                                            {request.resubmissionRequestedAt
                                                                ? new Date(request.resubmissionRequestedAt).toLocaleString()
                                                                : 'N/A'
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                onClick={() => handleApproveReject(request.id, 'approve')}
                                                                color="success"
                                                                title="Approve"
                                                            >
                                                                <CheckCircleIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={() => handleApproveReject(request.id, 'reject')}
                                                                color="error"
                                                                title="Reject"
                                                            >
                                                                <CancelIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </>
                        </>
                    )}
                </Box>
            )}

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
