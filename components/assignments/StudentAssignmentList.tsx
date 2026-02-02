"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
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
    Alert,
    Skeleton,
    Tabs,
    Tab
} from "@mui/material";
import { AssignmentResponseDTO } from "@/engines/DRIVERS/ASSIGNMENT/assignment.types";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from "date-fns";
import { fetchAssignments, fetchSubmissionStatus, submitAssignment, requestResubmission } from "@/lib/api/assignments";

export default function StudentAssignmentList() {
    const queryClient = useQueryClient();
    const [tabValue, setTabValue] = useState(0);
    const [uploadAssignment, setUploadAssignment] = useState<AssignmentResponseDTO | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [resubmissionReason, setResubmissionReason] = useState("");

    // Fetch assignments with caching
    const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
        queryKey: ['assignments'],
        queryFn: fetchAssignments,
        staleTime: 5 * 60 * 1000,
    });

    const submissionQueries = useQueries({
        queries: assignments.map((assignment: AssignmentResponseDTO) => ({
            queryKey: ['submissionStatus', assignment.id],
            queryFn: () => fetchSubmissionStatus(assignment.id),
            staleTime: 30 * 1000,
            enabled: !!assignment.id,
        }))
    });

    const submissionStatus: Record<string, any> = {};
    assignments.forEach((assignment: AssignmentResponseDTO, index: number) => {
        submissionStatus[assignment.id] = submissionQueries[index]?.data;
    });

    const filteredAssignments = assignments.filter((assignment: AssignmentResponseDTO) => {
        const status = submissionStatus[assignment.id]?.submission;
        if (tabValue === 0) return true; // All
        if (tabValue === 1) return status?.hasPendingRequest; // Pending
        if (tabValue === 2) return status?.canResubmit; // Approved
        if (tabValue === 3) return status?.isRejected; // Rejected
        return true;
    });

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: ({ assignmentId, file }: { assignmentId: string, file: File }) =>
            submitAssignment(assignmentId, file),
        onSuccess: (_, variables) => {
            setSuccessMsg("Assignment submitted successfully!");
            queryClient.invalidateQueries({ queryKey: ['submissionStatus', variables.assignmentId] });
            setTimeout(() => {
                setSuccessMsg(null);
                setUploadAssignment(null);
                setFile(null);
            }, 2000);
        },
        onError: (error: any) => {
            setErrorMsg(error.message || "Upload failed");
        },
    });

    // Resubmission request mutation
    const resubmissionMutation = useMutation({
        mutationFn: ({ assignmentId, reason }: { assignmentId: string, reason: string }) =>
            requestResubmission(assignmentId, reason),
        onSuccess: (_, variables) => {
            setSuccessMsg("Resubmission request sent successfully!");
            queryClient.invalidateQueries({ queryKey: ['submissionStatus', variables.assignmentId] });
            setResubmissionReason("");
            setTimeout(() => {
                setSuccessMsg(null);
                setUploadAssignment(null);
            }, 2000);
        },
        onError: (error: any) => {
            setErrorMsg(error.message || "Request failed");
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file || !uploadAssignment) return;
        setErrorMsg(null);
        uploadMutation.mutate({ assignmentId: uploadAssignment.id, file });
    };

    const handleRequestResubmission = () => {
        if (!uploadAssignment || !resubmissionReason.trim()) return;
        setErrorMsg(null);
        resubmissionMutation.mutate({ assignmentId: uploadAssignment.id, reason: resubmissionReason });
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, margin: "0 auto" }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    My Assignments
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} variant="scrollable" scrollButtons="auto">
                        <Tab label="All" />
                        <Tab label="Pending Request" />
                        <Tab label="Approved" />
                        <Tab label="Rejected" />
                    </Tabs>
                </Box>
            </Box>

            {/* Loading State */}
            {assignmentsLoading && (
                <Grid container spacing={3}>
                    {Array.from(new Array(6)).map((_, index) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Skeleton variant="rounded" width={80} height={24} />
                                        <Skeleton variant="text" width={100} />
                                    </Box>
                                    <Skeleton variant="text" height={32} width="80%" sx={{ mb: 1 }} />
                                    <Skeleton variant="text" height={20} width="60%" />
                                    <Skeleton variant="text" height={20} width="90%" sx={{ mb: 2 }} />

                                    <Box sx={{ mt: 'auto' }}>
                                        <Skeleton variant="rectangular" height={36} width="100%" sx={{ borderRadius: 1 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Placeholder for when we hook up data */}
            {!assignmentsLoading && filteredAssignments.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No assignments found in this category.
                </Alert>
            )}

            <Grid container spacing={3}>
                {filteredAssignments.map((assignment: AssignmentResponseDTO) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={assignment.id}>
                        <Card sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: '0.3s',
                            border: submissionStatus[assignment.id]?.submission?.resubmissionApproved ? '2px solid' : 'none',
                            borderColor: 'success.light',
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
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {assignment.description}
                                </Typography>

                                {submissionStatus[assignment.id]?.submission?.isRejected && (
                                    <Alert severity="error" sx={{ mb: 2, py: 0 }}>
                                        <Typography variant="caption">
                                            <strong>Rejected:</strong> {submissionStatus[assignment.id]?.submission?.rejectionReason || "No reason provided"}
                                        </Typography>
                                    </Alert>
                                )}

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
                                        <>
                                            {submissionStatus[assignment.id]?.submitted ? (
                                                <>
                                                    {submissionStatus[assignment.id]?.submission?.hasPendingRequest ? (
                                                        <Alert severity="warning" icon={<CheckCircleIcon />}>
                                                            Resubmission request pending approval
                                                        </Alert>
                                                    ) : submissionStatus[assignment.id]?.submission?.canResubmit ? (
                                                        <Button
                                                            variant="contained"
                                                            startIcon={<CloudUploadIcon />}
                                                            onClick={() => setUploadAssignment(assignment)}
                                                            fullWidth
                                                            sx={{ background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)' }}
                                                        >
                                                            Re-upload File
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 1 }}>
                                                                Already submitted
                                                            </Alert>
                                                            <Button
                                                                variant="outlined"
                                                                onClick={() => setUploadAssignment(assignment)}
                                                                fullWidth
                                                                size="small"
                                                            >
                                                                {submissionStatus[assignment.id]?.submission?.isRejected ? "Request Resubmission Again" : "Request Resubmission"}
                                                            </Button>
                                                        </>
                                                    )}
                                                </>
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
                                        </>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Upload/Resubmission Dialog */}
            <Dialog open={!!uploadAssignment} onClose={() => !uploadMutation.isPending && !resubmissionMutation.isPending && setUploadAssignment(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {uploadAssignment && submissionStatus[uploadAssignment.id]?.submitted && !submissionStatus[uploadAssignment.id]?.submission?.canResubmit
                        ? "Request Resubmission Permission"
                        : "Submit Assignment"
                    }
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        {uploadAssignment?.title && <strong>{uploadAssignment.title}</strong>}
                    </Typography>

                    {uploadAssignment && submissionStatus[uploadAssignment.id]?.submitted && !submissionStatus[uploadAssignment.id]?.submission?.canResubmit ? (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
                                You have already submitted this assignment. Please provide a reason for requesting resubmission permission:
                            </Typography>
                            <Box
                                component="textarea"
                                value={resubmissionReason}
                                onChange={(e: any) => setResubmissionReason(e.target.value)}
                                placeholder="e.g., I uploaded the wrong file, need to add more information..."
                                sx={{
                                    width: '100%',
                                    minHeight: 100,
                                    p: 2,
                                    border: '1px solid #ccc',
                                    borderRadius: 1,
                                    fontFamily: 'inherit',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </>
                    ) : (
                        <Box sx={{ mt: 3, border: '2px dashed #ccc', borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer' }}>
                            <input accept="application/pdf,image/*,.doc,.docx" style={{ display: 'none' }} id="raised-button-file" type="file" onChange={handleFileChange} />
                            <label htmlFor="raised-button-file">
                                <Button variant="text" component="span" startIcon={<CloudUploadIcon sx={{ fontSize: 40 }} />}>
                                    {file ? file.name : "Click to select file"}
                                </Button>
                            </label>
                        </Box>
                    )}

                    {(uploadMutation.isPending || resubmissionMutation.isPending) && <LinearProgress sx={{ mt: 2 }} />}
                    {successMsg && <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircleIcon />}>{successMsg}</Alert>}
                    {errorMsg && <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setUploadAssignment(null); setErrorMsg(null); setResubmissionReason(""); }} disabled={uploadMutation.isPending || resubmissionMutation.isPending}>
                        Cancel
                    </Button>
                    {uploadAssignment && submissionStatus[uploadAssignment.id]?.submitted && !submissionStatus[uploadAssignment.id]?.submission?.canResubmit ? (
                        <Button
                            onClick={handleRequestResubmission}
                            variant="contained"
                            disabled={!resubmissionReason.trim() || resubmissionMutation.isPending}
                        >
                            Send Request
                        </Button>
                    ) : (
                        <Button onClick={handleUpload} variant="contained" disabled={!file || uploadMutation.isPending}>
                            Upload
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
