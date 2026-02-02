import { Box, Skeleton, List, ListItem, ListItemAvatar, ListItemText, Divider } from "@mui/material";

export function ConversationSkeleton() {
    return (
        <List>
            {Array.from(new Array(5)).map((_, index) => (
                <Box key={index}>
                    <ListItem>
                        <ListItemAvatar>
                            <Skeleton variant="circular" width={40} height={40} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={<Skeleton variant="text" width="60%" />}
                            secondary={<Skeleton variant="text" width="40%" />}
                        />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                </Box>
            ))}
        </List>
    );
}

export function MessageSkeleton() {
    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from(new Array(3)).map((_, index) => (
                <Box key={index} sx={{ alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end', width: '60%' }}>
                    <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="text" width="30%" sx={{ alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end', mt: 0.5 }} />
                </Box>
            ))}
        </Box>
    );
}
