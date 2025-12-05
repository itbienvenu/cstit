'use client';

import * as React from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    Avatar,
    ListItemText,
    TextField,
    IconButton,
    Badge,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    Autocomplete,
    Button,
    CircularProgress,
    Menu,
    MenuItem
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddCommentIcon from '@mui/icons-material/AddComment';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface User {
    _id: string;
    name: string;
    email: string;
}

interface Conversation {
    _id: string;
    participants: string[];
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    otherUser: {
        name: string;
        email: string;
    };
}

interface Message {
    _id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isEdited?: boolean;
    isDeleted?: boolean;
    deletedFor?: string[];
}

export default function ChatSystem() {
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [currentUser, setCurrentUser] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

    // New Chat Dialog
    const [openNewChat, setOpenNewChat] = React.useState(false);
    const [users, setUsers] = React.useState<User[]>([]);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

    // Edit/Delete State
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);
    const [editMode, setEditMode] = React.useState(false);

    // Delete Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000); // Poll for conversation list updates
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation._id);
            const interval = setInterval(() => fetchMessages(selectedConversation._id), 3000); // Poll for messages
            return () => clearInterval(interval);
        }
    }, [selectedConversation]);

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchMessages = async (convId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`/api/chat/messages?conversationId=${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const token = localStorage.getItem('token');

        if (editMode && selectedMessage) {
            // Update message
            try {
                const res = await fetch('/api/chat/messages', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        messageId: selectedMessage._id,
                        content: newMessage,
                        action: 'edit'
                    })
                });

                if (res.ok) {
                    setNewMessage('');
                    setEditMode(false);
                    setSelectedMessage(null);
                    fetchMessages(selectedConversation._id);
                }
            } catch (error) {
                console.error('Error updating message:', error);
            }
        } else {
            // Create message
            try {
                const res = await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        conversationId: selectedConversation._id,
                        content: newMessage
                    })
                });

                if (res.ok) {
                    setNewMessage('');
                    fetchMessages(selectedConversation._id);
                    fetchConversations();
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleNewChatOpen = async () => {
        setOpenNewChat(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.filter((u: User) => u._id !== currentUser.id));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const startConversation = async () => {
        if (!selectedUser) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ recipientId: selectedUser._id })
            });

            if (res.ok) {
                await fetchConversations();
                setOpenNewChat(false);
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, msg: Message) => {
        setAnchorEl(event.currentTarget);
        setSelectedMessage(msg);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        if (!editMode) setSelectedMessage(null);
    };

    const handleEditClick = () => {
        if (selectedMessage) {
            setNewMessage(selectedMessage.content);
            setEditMode(true);
        }
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const confirmDelete = async (type: 'me' | 'everyone') => {
        if (!selectedMessage) return;
        const token = localStorage.getItem('token');
        try {
            await fetch('/api/chat/messages', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    messageId: selectedMessage._id,
                    action: 'delete',
                    deleteType: type
                })
            });
            fetchMessages(selectedConversation?._id || '');
        } catch (error) {
            console.error('Error deleting message:', error);
        }
        setDeleteDialogOpen(false);
        setSelectedMessage(null);
    };

    return (
        <Box sx={{ display: 'flex', height: '80vh', bgcolor: 'transparent', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0, 255, 0, 0.1)', backdropFilter: 'blur(5px)' }}>
            {/* Sidebar */}
            <Box sx={{
                width: { xs: selectedConversation ? 0 : '100%', md: 320 },
                borderRight: 1,
                borderColor: 'rgba(0, 255, 0, 0.1)',
                display: { xs: selectedConversation ? 'none' : 'flex', md: 'flex' },
                flexDirection: 'column',
                bgcolor: 'rgba(0, 0, 0, 0.3)'
            }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0, 255, 0, 0.1)', color: 'text.primary', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>CHATS</Typography>
                    <IconButton color="primary" onClick={handleNewChatOpen}>
                        <AddCommentIcon />
                    </IconButton>
                </Box>
                <Divider sx={{ borderColor: 'rgba(0, 255, 0, 0.1)' }} />
                <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {conversations.map((conv) => (
                        <ListItem key={conv._id} disablePadding>
                            <ListItemButton
                                onClick={() => setSelectedConversation(conv)}
                                selected={selectedConversation?._id === conv._id}
                                sx={{
                                    '&.Mui-selected': { bgcolor: 'rgba(0, 255, 0, 0.1)' },
                                    '&:hover': { bgcolor: 'rgba(0, 255, 0, 0.05)' }
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'secondary.main', color: 'black' }}>
                                        {conv.otherUser.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={conv.otherUser.name}
                                    secondary={conv.unreadCount > 0 ? (conv.lastMessage === 'Encrypted Message' ? 'Encrypted Message' : 'New Message') : conv.lastMessage === 'Encrypted Message' ? 'Encrypted' : 'Opened'}
                                    primaryTypographyProps={{ fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal', color: 'text.primary' }}
                                    secondaryTypographyProps={{ color: 'text.secondary', fontFamily: 'monospace' }}
                                />
                                {conv.unreadCount > 0 && (
                                    <Badge badgeContent={conv.unreadCount} color="error" />
                                )}
                            </ListItemButton>
                        </ListItem>
                    ))}
                    {conversations.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography variant="body2">No conversations yet.</Typography>
                            <Button size="small" onClick={handleNewChatOpen} sx={{ mt: 1, color: 'primary.main' }}>Start one</Button>
                        </Box>
                    )}
                </List>
            </Box>

            {/* Chat Area */}
            <Box sx={{
                flexGrow: 1,
                display: { xs: selectedConversation ? 'flex' : 'none', md: 'flex' },
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'transparent'
            }}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'rgba(0, 255, 0, 0.1)', display: 'flex', alignItems: 'center', bgcolor: 'rgba(0, 0, 0, 0.3)' }}>
                            <IconButton
                                edge="start"
                                color="inherit"
                                onClick={() => setSelectedConversation(null)}
                                sx={{ mr: 1, display: { md: 'none' } }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Avatar sx={{ mr: 2, bgcolor: 'secondary.main', color: 'black' }}>
                                {selectedConversation.otherUser.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary', fontFamily: 'monospace' }}>
                                {selectedConversation.otherUser.name} <span style={{ color: '#00ff00' }}>[ONLINE]</span>
                            </Typography>
                        </Box>

                        {/* Messages */}
                        <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {messages.map((msg) => {
                                const isMe = msg.senderId === currentUser?.id;
                                if (msg.deletedFor?.includes(currentUser?.id)) return null;

                                return (
                                    <Box
                                        key={msg._id}
                                        sx={{
                                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                                            maxWidth: '70%',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            flexDirection: isMe ? 'row-reverse' : 'row',
                                        }}
                                    >
                                        <Box sx={{
                                            bgcolor: isMe ? 'rgba(0, 255, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                            color: 'text.primary',
                                            p: 1.5,
                                            borderRadius: 2,
                                            borderBottomRightRadius: isMe ? 0 : 2,
                                            borderBottomLeftRadius: isMe ? 2 : 0,
                                            border: '1px solid',
                                            borderColor: isMe ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                                            position: 'relative'
                                        }}>
                                            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                                {msg.isDeleted ? <span style={{ fontStyle: 'italic', opacity: 0.5 }}>This message was deleted</span> : msg.content}
                                                {msg.isEdited && !msg.isDeleted && <span style={{ fontSize: '0.7em', color: 'gray', marginLeft: 8 }}>(edited)</span>}
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right', opacity: 0.5, fontSize: '0.7rem' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                        {isMe && !msg.isDeleted && (
                                            <IconButton size="small" onClick={(e) => handleMenuClick(e, msg)} sx={{ opacity: 0.5, ml: 0.5, mr: 0.5 }}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* Input Area */}
                        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.3)', borderTop: 1, borderColor: 'rgba(0, 255, 0, 0.1)', display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                placeholder={editMode ? "Edit message..." : "Type a message..."}
                                variant="outlined"
                                size="small"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                                        color: 'text.primary'
                                    }
                                }}
                            />
                            {editMode && (
                                <Button variant="text" color="secondary" onClick={() => { setEditMode(false); setNewMessage(''); setSelectedMessage(null); }}>
                                    Cancel
                                </Button>
                            )}
                            <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
                                {editMode ? <EditIcon /> : <SendIcon />}
                            </IconButton>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: 'text.secondary' }}>
                        <AddCommentIcon sx={{ fontSize: 60, mb: 2, opacity: 0.2, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>SELECT_TARGET_TO_INITIATE_CHAT</Typography>
                    </Box>
                )}
            </Box>

            {/* New Chat Dialog */}
            <Dialog open={openNewChat} onClose={() => setOpenNewChat(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#111', border: '1px solid #333' } }}>
                <DialogTitle>New Chat</DialogTitle>
                <DialogContent>
                    <Autocomplete
                        options={users}
                        getOptionLabel={(option) => `${option.name} (${option.email})`}
                        value={selectedUser}
                        onChange={(event, newValue) => setSelectedUser(newValue)}
                        renderInput={(params) => <TextField {...params} label="Search User" margin="normal" fullWidth />}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={startConversation}
                        disabled={!selectedUser}
                        sx={{ mt: 2 }}
                    >
                        Start Chat
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { bgcolor: '#111', border: '1px solid #333' } }}
            >
                <MenuItem onClick={handleEditClick}>
                    <EditIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                </MenuItem>
                <MenuItem onClick={handleDeleteClick}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                </MenuItem>
            </Menu>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { bgcolor: '#111', border: '1px solid #333' } }}>
                <DialogTitle>Delete Message?</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>How would you like to delete this message?</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                        <Button onClick={() => confirmDelete('me')} color="primary">For Me</Button>
                        <Button onClick={() => confirmDelete('everyone')} color="error">For Everyone</Button>
                    </Box>
                </DialogContent>
            </Dialog>

        </Box>
    );
}
