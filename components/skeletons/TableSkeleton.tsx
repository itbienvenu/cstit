
import * as React from 'react';
import {
    TableRow,
    TableCell,
    Skeleton
} from '@mui/material';

interface TableSkeletonProps {
    rows?: number;
    columns: number;
}

export default function TableSkeleton({ rows = 5, columns }: TableSkeletonProps) {
    return (
        <>
            {Array.from(new Array(rows)).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                    {Array.from(new Array(columns)).map((_, colIndex) => (
                        <TableCell key={colIndex}>
                            <Skeleton variant="text" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}
