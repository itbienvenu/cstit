type submissionHead = {
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

type submissionBody = submissionHead & {
    creatorId: string;
    organizationId: string;
}

type submissionResponse = submissionBody & {
    creator: string;
    organization: string;
}