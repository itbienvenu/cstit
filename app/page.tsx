'use client';

import * as React from 'react';
import PostList from '@/components/PostList';
import PostCardSkeleton from '@/components/skeletons/PostCardSkeleton';
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
        <Container maxWidth="xl">
          {/* Top Banner Ad Placeholder */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            {/* Dynamic imported placeholder or direct usage */}
            <div style={{ width: '100%', maxWidth: '728px' }}>
              <Box
                sx={{
                  width: '100%',
                  height: 90,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #ccc',
                  bgcolor: '#f5f5f5',
                  mb: 2
                }}
              >
                <Typography color="text.secondary">TOP BANNER ADS (728x90)</Typography>
              </Box>
            </div>
          </Box>

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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' }, gap: 4 }}>
            {/* Main Feed Column */}
            <Box>
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
                  {Array.from(new Array(3)).map((_, index) => (
                    <PostCardSkeleton key={index} />
                  ))}
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
            </Box>

            {/* Right Sidebar Column */}
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              <Box sx={{ position: 'sticky', top: 100 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px dashed #ff0000',
                    bgcolor: '#ffecec',
                    mb: 4,
                    zIndex: 10
                  }}
                >
                  <Typography color="error" fontWeight="bold">SIDEBAR ADS (160x600)</Typography>
                </Box>

                <Box
                  sx={{
                    width: '100%',
                    height: 250,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px dashed #ff0000',
                    bgcolor: '#ffecec',
                    zIndex: 10
                  }}
                >
                  <Typography color="error" fontWeight="bold">SIDEBAR ADS (300x250)</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

        </Container>
      </Box>
    </main>
  );
}
