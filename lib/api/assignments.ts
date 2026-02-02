// API utility functions for React Query

export async function fetchAssignments() {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }

    const res = await fetch("/api/assignments", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch assignments");
    }

    return res.json();
}

export async function fetchSubmissionStatus(assignmentId: string) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }

    const res = await fetch(`/api/assignments/${assignmentId}/status`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch submission status");
    }

    return res.json();
}

export async function submitAssignment(assignmentId: string, file: File) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Upload failed");
    }

    return data;
}

export async function requestResubmission(assignmentId: string, reason: string) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token found");
    }

    const res = await fetch(`/api/assignments/${assignmentId}/resubmission-request`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}
