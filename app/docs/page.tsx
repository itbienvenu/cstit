'use client';

import * as React from 'react';
import Navbar from '@/components/Navbar';
import {
    Container,
    Box,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Paper,
    Divider,
    Chip,
    Alert,
} from '@mui/material';

const sections = [
    { id: 'intro', title: 'Introduction' },
    { id: 'auth', title: 'Authentication' },
    { id: 'posts', title: 'Posts & Announcements' },
    { id: 'admin', title: 'Admin & Classes' },
    { id: 'user-guide', title: 'User Guide' },
];

export default function DocumentationPage() {
    const [activeSection, setActiveSection] = React.useState('intro');

    // Simple scroll spy or click handler
    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <main>
            <Navbar />
            <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
                <Grid container spacing={4}>
                    {/* Sidebar */}
                    <Grid size={{ xs: 12, md: 3 }} sx={{ position: { md: 'sticky' }, top: { md: 80 }, height: 'fit-content' }}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRight: 1, borderColor: 'divider' }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                Documentation
                            </Typography>
                            <List component="nav">
                                {sections.map((section) => (
                                    <ListItem key={section.id} disablePadding>
                                        <ListItemButton
                                            selected={activeSection === section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            sx={{
                                                borderRadius: 1,
                                                '&.Mui-selected': {
                                                    color: 'primary.main',
                                                    borderLeft: 2,
                                                    borderColor: 'primary.main',
                                                    bgcolor: 'transparent',
                                                }
                                            }}
                                        >
                                            <ListItemText primary={section.title} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Main Content */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        <Box sx={{ maxWidth: 800 }}>
                            {/* Introduction */}
                            <Section id="intro" title="Introduction">
                                <Typography paragraph>
                                    Welcome to the <strong>URCSTIT Blog App API & User Guide</strong>.
                                    This platform is designed as a multi-tenant SaaS application for managing class announcements, students, and interactions.
                                </Typography>
                                <Typography paragraph>
                                    It features a hierarchical role system:
                                </Typography>
                                <ul>
                                    <li><strong>Super Admin:</strong> Creates Classes (Organizations) and Class Representatives.</li>
                                    <li><strong>Class Representative:</strong> Manages students and posts announcements for their specific class.</li>
                                    <li><strong>Student:</strong> Registers with a unique Class Code and views class-specific content.</li>
                                </ul>
                            </Section>

                            <Divider sx={{ my: 4 }} />

                            {/* Authentication */}
                            <Section id="auth" title="Authentication">
                                <Endpoint
                                    method="POST"
                                    path="/api/auth/register"
                                    description="Register a new student account."
                                />
                                <CodeBlock
                                    code={`// Request Body
{
  "email": "student@example.com",
  "password": "securepassword",
  "name": "Jane Doe",
  "classCode": "CS101" // Required to join a specific class
}`}
                                />
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    New students are set to <code>pending</code> status and must be approved by their Class Representative.
                                </Alert>

                                <Box sx={{ mt: 4 }} />

                                <Endpoint
                                    method="POST"
                                    path="/api/auth/login"
                                    description="Authenticate and receive a JWT token."
                                />
                                <CodeBlock
                                    code={`// Response
{
  "token": "eyJhbGcV...",
  "user": {
    "id": "123",
    "email": "...",
    "role": "student" | "class_rep" | "super_admin",
    "organizationId": "..."
  }
}`}
                                />
                            </Section>

                            <Divider sx={{ my: 4 }} />

                            {/* Posts */}
                            <Section id="posts" title="Posts & Announcements">
                                <Endpoint
                                    method="GET"
                                    path="/api/posts"
                                    description="Fetch announcements. Publicly accessible."
                                />
                                <Typography variant="body2" sx={{ mb: 1 }}><strong>Query Parameters:</strong></Typography>
                                <ul>
                                    <li><code>classCode</code> (optional): Filter posts by strict class code (e.g., <code>?classCode=CS101</code>).</li>
                                </ul>

                                <Box sx={{ mt: 4 }} />

                                <Endpoint
                                    method="POST"
                                    path="/api/posts"
                                    description="Create a new announcement. (Class Rep & Super Admin only)"
                                />
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Automatically tags the post with the creator's <code>organizationId</code> and <code>classCode</code>.
                                </Typography>
                            </Section>

                            <Divider sx={{ my: 4 }} />

                            {/* Admin */}
                            <Section id="admin" title="Admin & Classes">
                                <Endpoint
                                    method="POST"
                                    path="/api/admin/classes"
                                    description="Create a new Class (Organization) and its first Class Representative."
                                />
                                <Chip label="Super Admin Only" color="error" size="small" />
                                <CodeBlock
                                    code={`// Request Body
{
  "className": "Computer Science 2024",
  "classCode": "CS2024",
  "repName": "John Rep",
  "repEmail": "rep@cs2024.com",
  "repPassword": "repPassword123"
}`}
                                />
                            </Section>

                            <Divider sx={{ my: 4 }} />

                            {/* User Guide */}
                            <Section id="user-guide" title="User Guide">
                                <Typography variant="h6" gutterBottom>For Students</Typography>
                                <ol>
                                    <li><strong>Register:</strong> Go to <code>/register</code>. Enter your details and the <strong>Class Code</strong> provided by your rep.</li>
                                    <li><strong>Wait for Approval:</strong> Your account will be pending until the Class Rep approves it.</li>
                                    <li><strong>Browse:</strong> Once approved, login to see announcements. You can also search for your class code on the home page without logging in.</li>
                                    <li><strong>Chat:</strong> Use the Chat feature to message other students in your class.</li>
                                </ol>

                                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>For Class Representatives</Typography>
                                <ol>
                                    <li><strong>Manage Students:</strong> Go to the Dashboard to see pending student requests. Approve or Reject them.</li>
                                    <li><strong>Post Announcements:</strong> Create posts for your class. You can choose to notify specific students via email.</li>
                                </ol>

                                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>For Super Admins</Typography>
                                <ol>
                                    <li><strong>Create Classes:</strong> Use the "Create Class" tab in the Admin Dashboard to onboard new classes.</li>
                                    <li><strong>Manage the Platform:</strong> You have oversight of all users and posts.</li>
                                </ol>
                            </Section>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </main>
    );
}

function Section({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
    return (
        <Box id={id} sx={{ scrollMarginTop: 100, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {title}
            </Typography>
            {children}
        </Box>
    );
}

function Endpoint({ method, path, description }: { method: string, path: string, description: string }) {
    const color = method === 'GET' ? 'success' : method === 'POST' ? 'primary' : method === 'DELETE' ? 'error' : 'warning';
    return (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderLeft: 4, borderColor: `${color}.main`, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Chip label={method} color={color as any} size="small" sx={{ fontWeight: 'bold' }} />
                <Typography variant="subtitle1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {path}
                </Typography>
            </Box>
            <Typography variant="body2">{description}</Typography>
        </Paper>
    );
}

function CodeBlock({ code }: { code: string }) {
    return (
        <Box
            component="pre"
            sx={{
                p: 2,
                bgcolor: '#1e1e1e',
                color: '#d4d4d4',
                borderRadius: 1,
                overflowX: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                my: 2
            }}
        >
            <code>{code}</code>
        </Box>
    );
}
