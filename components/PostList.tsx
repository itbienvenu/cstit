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
import ReplyIcon from '@mui/icons-material/Reply';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { Post, ReactionType } from '@/lib/schemas';

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

const REACTION_ICONS: Record<string, React.ReactNode> = {
    like: <ThumbUpIcon color="primary" />,
    love: <FavoriteIcon color="error" />,
    haha: <EmojiEmotionsIcon color="warning" />,
    wow: <EmojiEmotionsIcon color="info" />,
    sad: <SentimentDissatisfiedIcon color="action" />,
    angry: <SentimentDissatisfiedIcon color="error" />,
};

export default function PostList({ initialPosts }: { initialPosts: Post[] }) {
    const [posts, setPosts] = React.useState(initialPosts);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, maxWidth: 800, mx: 'auto' }}>
            <TextField
                fullWidth
                label="Search Announcements"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
            />
            {filteredPosts.map((post: any) => (
                <PostCard key={post._id} post={post} />
            ))}
            {filteredPosts.length === 0 && (
                <Typography align="center" color="text.secondary">
                    No announcements found.
                </Typography>
            )}
        </Box>
    );
}

function PostCard({ post }: { post: any }) {
    const [expanded, setExpanded] = React.useState(false);
    const [comment, setComment] = React.useState('');
    const [comments, setComments] = React.useState<any[]>([]);
    const [reactions, setReactions] = React.useState<any[]>(post.reactions || []);
    const [user, setUser] = React.useState<any>(null);
    const [reactionAnchorEl, setReactionAnchorEl] = React.useState<null | HTMLElement>(null);

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

    const handleReaction = async (type: ReactionType) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to react');
            return;
        }
        setReactionAnchorEl(null);

        const res = await fetch('/api/reactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ targetId: post._id, targetType: 'post', reactionType: type }),
        });

        if (res.ok) {
            const data = await res.json();
            setReactions(data.reactions);
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

    const handleCommentSubmit = async (parentId?: string) => {
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
            body: JSON.stringify({ content: comment, postId: post._id, parentId }),
        });

        if (res.ok) {
            setComment('');
            fetchComments();
        } else {
            alert('Failed to post comment');
        }
    };

    const userReaction = reactions.find((r: any) => user && r.userId === user.id);

    // Build comment tree
    const commentTree = React.useMemo(() => {
        const map: any = {};
        const roots: any[] = [];
        comments.forEach((c) => {
            map[c._id] = { ...c, children: [] };
        });
        comments.forEach((c) => {
            if (c.parentId && map[c.parentId]) {
                map[c.parentId].children.push(map[c._id]);
            } else {
                roots.push(map[c._id]);
            }
        });
        return roots;
    }, [comments]);

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
                <Tooltip title={reactions.map(r => r.userName).join(', ') || 'No reactions'}>
                    <IconButton onClick={(e) => setReactionAnchorEl(e.currentTarget)}>
                        {userReaction ? REACTION_ICONS[userReaction.type] : <ThumbUpIcon />}
                    </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ mr: 2 }}>{reactions.length}</Typography>

                <Menu
                    anchorEl={reactionAnchorEl}
                    open={Boolean(reactionAnchorEl)}
                    onClose={() => setReactionAnchorEl(null)}
                    sx={{ display: 'flex', flexDirection: 'row' }}
                >
                    {Object.keys(REACTION_ICONS).map((type) => (
                        <MenuItem key={type} onClick={() => handleReaction(type as ReactionType)}>
                            {REACTION_ICONS[type]}
                        </MenuItem>
                    ))}
                </Menu>

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
                        {commentTree.map((c: any) => (
                            <CommentItem key={c._id} comment={c} user={user} onRefresh={fetchComments} />
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
                        <Button variant="contained" onClick={() => handleCommentSubmit()}>
                            Post
                        </Button>
                    </Box>
                </CardContent>
            </Collapse>
        </Card>
    );
}

function CommentItem({ comment, user, onRefresh }: { comment: any, user: any, onRefresh: () => void }) {
    const [replying, setReplying] = React.useState(false);
    const [replyContent, setReplyContent] = React.useState('');
    const [editing, setEditing] = React.useState(false);
    const [editContent, setEditContent] = React.useState(comment.content);

    const handleReply = async () => {
        const token = localStorage.getItem('token');
        if (!token) { alert('Login to reply'); return; }

        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ content: replyContent, postId: comment.postId, parentId: comment._id }),
        });
        if (res.ok) {
            setReplying(false);
            setReplyContent('');
            onRefresh();
        }
    };

    const handleEdit = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/comments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ commentId: comment._id, content: editContent }),
        });
        if (res.ok) {
            setEditing(false);
            onRefresh();
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete comment?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/comments?commentId=${comment._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) onRefresh();
    };

    return (
        <Paper sx={{ p: 1, bgcolor: 'background.paper', ml: comment.parentId ? 4 : 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {comment.authorName}
                </Typography>
                <Box>
                    {user && (
                        <IconButton size="small" onClick={() => setReplying(!replying)}>
                            <ReplyIcon fontSize="small" />
                        </IconButton>
                    )}
                    {user && (user.id === comment.authorId || user.role === 'super_admin') && (
                        <>
                            <IconButton size="small" onClick={() => setEditing(!editing)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={handleDelete}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </>
                    )}
                </Box>
            </Box>
            {editing ? (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField fullWidth size="small" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                    <Button size="small" onClick={handleEdit}>Save</Button>
                    <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
                </Box>
            ) : (
                <Typography variant="body2">{comment.content}</Typography>
            )}
            {replying && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField fullWidth size="small" placeholder="Reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} />
                    <Button size="small" onClick={handleReply}>Reply</Button>
                </Box>
            )}
            {comment.children && comment.children.map((child: any) => (
                <Box key={child._id} sx={{ mt: 1 }}>
                    <CommentItem comment={child} user={user} onRefresh={onRefresh} />
                </Box>
            ))}
        </Paper>
    );
}
