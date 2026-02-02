import { Card, CardHeader, CardContent, Skeleton } from "@mui/material";

export default function PostCardSkeleton() {
    return (
        <Card sx={{ width: '100%', mb: 3 }}>
            <CardHeader
                avatar={<Skeleton variant="circular" width={40} height={40} />}
                title={<Skeleton variant="text" width="40%" />}
                subheader={<Skeleton variant="text" width="20%" />}
            />
            <CardContent>
                <Skeleton variant="text" height={20} width="90%" sx={{ mb: 1 }} />
                <Skeleton variant="text" height={20} width="80%" sx={{ mb: 1 }} />
                <Skeleton variant="text" height={20} width="40%" />
            </CardContent>
        </Card>
    );
}
