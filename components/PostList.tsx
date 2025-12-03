'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
    const [likes, setLikes] = React.useState<string[]>(post.likes || []);
    const [user, setUser] = React.useState<any>(null);
    const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
    const [editContent, setEditContent] = React.useState('');

    React.useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

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

    const handleLike = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to like');
            return;
        }

        const res = await fetch('/api/posts/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ postId: post._id }),
        });

        if (res.ok) {
            const data = await res.json();
            setLikes(data.likes);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            navigator.clipboard.writeText(`${window.location.origin}/posts/${post._id}`);
            alert('Link copied to clipboard!');
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

    const handleEditComment = async (commentId: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/comments', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ commentId, content: editContent }),
        });

        if (res.ok) {
            setEditingCommentId(null);
            setEditContent('');
            fetchComments();
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/comments?commentId=${commentId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            fetchComments();
        }
    };

    const isLiked = user && likes.includes(user.id);

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
                <IconButton aria-label="add to favorites" onClick={handleLike} color={isLiked ? 'error' : 'default'}>
                    <FavoriteIcon />
                </IconButton>
                <Typography variant="caption" sx={{ mr: 2 }}>{likes.length}</Typography>
                <IconButton aria-label="share" onClick={handleShare}>
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {c.authorName}
                                    </Typography>
                                    {user && (user.id === c.authorId || user.role === 'super_admin') && (
                                        <Box>
                                            <IconButton size="small" onClick={() => {
                                                setEditingCommentId(c._id);
                                                setEditContent(c.content);
                                            }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteComment(c._id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                                {editingCommentId === c._id ? (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                        <Button variant="contained" size="small" onClick={() => handleEditComment(c._id)}>Save</Button>
                                        <Button size="small" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                    </Box>
                                ) : (
                                    <Typography variant="body2">{c.content}</Typography>
                                )}
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
