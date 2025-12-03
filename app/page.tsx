import clientPromise from '@/lib/db';
import PostList from '@/components/PostList';
import Navbar from '@/components/Navbar';
import { Box, Typography } from '@mui/material';
import { Post } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

async function getPosts() {
  try {
    const client = await clientPromise;
    const db = client.db('blog_app');
    const posts = await db.collection('posts').find({}).sort({ createdAt: -1 }).toArray();
    // Serialize ObjectId and Date
    return posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(), // Convert date to string for client component
    }));
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

export default async function Home() {
  const posts = await getPosts();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'URCSTIT Class Announcements',
    description: 'Latest updates and announcements for the class.',
    url: 'http://localhost:3000',
    blogPost: posts.map((post: any) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      author: {
        '@type': 'Person',
        name: post.authorName,
      },
      datePublished: post.createdAt,
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Box sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
          Latest Announcements
        </Typography>
        <PostList initialPosts={posts as unknown as Post[]} />
      </Box>
    </main>
  );
}
