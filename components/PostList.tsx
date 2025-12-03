'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { Post } from '@/lib/schemas';

interface ExpandMoreProps {
    expand: boolean;
}

const ExpandMore = styled((props: any) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

export default function PostList({ initialPosts }: { initialPosts: Post[] }) {
    const [posts, setPosts] = React.useState(initialPosts);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, maxWidth: 800, mx: 'auto' }}>
            {posts.map((post: any) => (
                <PostCard key={post._id} post={post} />
            ))}
        </Box>
    );
}

function PostCard({ post }: { post: any }) {
    const [expanded, setExpanded] = React.useState(false);
    const [comment, setComment] = React.useState('');
    const [comments, setComments] = React.useState<any[]>([]);

    const fetchComments = async () => {
        const res = await fetch(`/api/comments?postId=${post._id}`);
        if (res.ok) {
            setComments(await res.json());
        }
    };

    const handleExpandClick = () => {
        setExpanded(!expanded);
        if (!expanded) {
            fetchComments();
        }
    };

    const handleCommentSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to comment');
            return;
        }

        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: comment, postId: post._id }),
        });

        if (res.ok) {
            setComment('');
            fetchComments();
        } else {
            alert('Failed to post comment');
        }
    };

    return (
        <Card sx={{ width: '100%' }}>
            <CardHeader
                avatar={
                    <Avatar sx={{ bgcolor: 'secondary.main' }} aria-label="recipe">
                        {post.authorName ? post.authorName[0].toUpperCase() : 'U'}
                    </Avatar>
                }
                action={
                    <IconButton aria-label="settings">
                        <MoreVertIcon />
                    </IconButton>
                }
                title={post.title}
                subheader={new Date(post.createdAt).toLocaleDateString()}
            />
            <CardContent>
                <Typography variant="body2" color="text.secondary">
                    {post.description}
                </Typography>
            </CardContent>
            <CardActions disableSpacing>
                <IconButton aria-label="add to favorites">
                    <FavoriteIcon />
                </IconButton>
                <IconButton aria-label="share">
                    <ShareIcon />
                </IconButton>
                <ExpandMore
                    expand={expanded}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                >
                    <ExpandMoreIcon />
                </ExpandMore>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    <Typography paragraph variant="h6">Comments:</Typography>
                    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {comments.map((c) => (
                            <Paper key={c._id} sx={{ p: 1, bgcolor: 'background.paper' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {c.authorName}
                                </Typography>
                                <Typography variant="body2">{c.content}</Typography>
                            </Paper>
                        ))}
                        {comments.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No comments yet.
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Write a comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleCommentSubmit}>
                            Post
                        </Button>
                    </Box>
                </CardContent>
            </Collapse>
        </Card>
    );
}
