import { Card, CardContent, Skeleton, Box, Grid } from "@mui/material";

export default function AssignmentCardSkeleton() {
    return (
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
    );
}

export function AssignmentCardSkeletonGrid({ count = 6 }: { count?: number }) {
    return (

        <Grid container spacing={3}>
            {Array.from(new Array(count)).map((_, index) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                    <AssignmentCardSkeleton />
                </Grid>
            ))}
        </Grid>
    );
}
