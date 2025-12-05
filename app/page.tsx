'use client';

import * as React from 'react';
import PostList from '@/components/PostList';
import Navbar from '@/components/Navbar';
import { Box, Typography, Container, CircularProgress, Alert, TextField, Button } from '@mui/material';
import { Post } from '@/lib/schemas';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [classCodeFilter, setClassCodeFilter] = React.useState('');
  const router = useRouter();

  const fetchPosts = React.useCallback(async (code: string = '') => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const url = code ? `/api/posts?classCode=${code}` : '/api/posts';
      const res = await fetch(url, { headers });

      if (res.ok) {
        const data = await res.json();
        setPosts(data);
        setError('');
      } else {
        console.error('Failed to load');
        setError('Failed to load announcements.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(classCodeFilter);
  };

  return (
    <main>
      <Navbar />
      <Box sx={{ p: 4, minHeight: '80vh' }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
            Class Announcements
          </Typography>

          <Box component="form" onSubmit={handleFilter} sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
            <TextField
              label="Enter Class Code (e.g., CS101)"
              variant="outlined"
              size="small"
              value={classCodeFilter}
              onChange={(e) => setClassCodeFilter(e.target.value)}
              sx={{ bgcolor: 'background.paper', width: '300px' }}
            />
            <Button type="submit" variant="contained" size="large">
              Filter
            </Button>
            {classCodeFilter && (
              <Button variant="text" onClick={() => { setClassCodeFilter(''); fetchPosts(''); }}>
                Clear
              </Button>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="info" sx={{ mt: 2 }}>{error}</Alert>
          ) : (
            <PostList initialPosts={posts} />
          )}

          {!loading && posts.length === 0 && !error && (
            <Typography align="center" sx={{ mt: 4, color: 'text.secondary' }}>
              No announcements yet for your class.
            </Typography>
          )}
        </Container>
      </Box>
    </main>
  );
}
