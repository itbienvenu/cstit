"use client";

import { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Alert
} from "@mui/material";
import { AssignmentResponseDTO } from "@/engines/DRIVERS/ASSIGNMENT/assignment.types";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from "date-fns";

export default function StudentAssignmentList() {
    const [assignments, setAssignments] = useState<AssignmentResponseDTO[]>([]);
    const [uploadAssignment, setUploadAssignment] = useState<AssignmentResponseDTO | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const token = localStorage.getItem("token");
                // If no token, maybe redirect or just let it fail/empty
                if (!token) return;

                const res = await fetch("/api/assignments", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setAssignments(data);
                } else {
                    console.error("Failed to fetch assignments");
                }
            } catch (err) {
                console.error("Error fetching assignments:", err);
            }
        };

        fetchAssignments();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !uploadAssignment) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/assignments/${uploadAssignment.id}/submit`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            setSuccessMsg("Assignment submitted successfully!");
            setTimeout(() => {
                setSuccessMsg(null);
                setUploadAssignment(null);
                setFile(null);
            }, 2000);
        } catch (error) {
            console.error(error);
            alert("Failed to upload assignment");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, margin: "0 auto" }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                My Assignments
            </Typography>

            {/* Placeholder for when we hook up data */}
            {assignments.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No assignments found (or class ID not linked yet).
                </Alert>
            )}

            <Grid container spacing={3}>
                {assignments.map((assignment) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={assignment.id}>
                        <Card sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: '0.3s',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
                        }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Chip
                                        label={assignment.status}
                                        color={assignment.status === 'OPEN' ? 'success' : 'default'}
                                        size="small"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        Due: {format(new Date(assignment.deadlineAt), 'MMM dd, yyyy')}
                                    </Typography>
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    {assignment.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {assignment.description}
                                </Typography>

                                <Box sx={{ mt: 'auto' }}>
                                    {assignment.submissionMethod === 'LINK' ? (
                                        <Button
                                            variant="outlined"
                                            startIcon={<LinkIcon />}
                                            href={assignment.submissionLink || "#"}
                                            target="_blank"
                                            fullWidth
                                        >
                                            Open Submission Link
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            startIcon={<CloudUploadIcon />}
                                            onClick={() => setUploadAssignment(assignment)}
                                            fullWidth
                                            sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}
                                        >
                                            Submit File
                                        </Button>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Upload Dialog */}
            <Dialog open={!!uploadAssignment} onClose={() => !uploading && setUploadAssignment(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Submit Assignment</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Upload your work for: <strong>{uploadAssignment?.title}</strong>
                    </Typography>

                    <Box sx={{ mt: 3, border: '2px dashed #ccc', borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer' }}>
                        <input
                            accept="application/pdf,image/*,.doc,.docx"
                            style={{ display: 'none' }}
                            id="raised-button-file"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="raised-button-file">
                            <Button variant="text" component="span" startIcon={<CloudUploadIcon sx={{ fontSize: 40 }} />}>
                                {file ? file.name : "Click to select file"}
                            </Button>
                        </label>
                    </Box>
                    {uploading && <LinearProgress sx={{ mt: 2 }} />}
                    {successMsg && <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircleIcon />}>{successMsg}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadAssignment(null)} disabled={uploading}>Cancel</Button>
                    <Button onClick={handleUpload} variant="contained" disabled={!file || uploading}>
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
