import { z } from 'zod';

export const RoleEnum = z.enum(['user', 'class_rep', 'super_admin']);

export const UserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: RoleEnum.default('user'),
    isConfirmed: z.boolean().default(false), // For normal users to be confirmed by class reps
    isBlacklisted: z.boolean().default(false),
    createdAt: z.date().default(() => new Date()),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const ReactionEnum = z.enum(['like', 'love', 'haha', 'wow', 'sad', 'angry']);

export const PostSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    authorId: z.string(),
    authorName: z.string(),
    createdAt: z.date().default(() => new Date()),
    reactions: z.array(z.object({
        userId: z.string(),
        userName: z.string(),
        type: ReactionEnum
    })).default([]),
});

export const CommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
    authorId: z.string(),
    authorName: z.string(),
    postId: z.string(),
    parentId: z.string().optional().nullable(), // For nested replies
    createdAt: z.date().default(() => new Date()),
    reactions: z.array(z.object({
        userId: z.string(),
        userName: z.string(),
        type: ReactionEnum
    })).default([]),
});

export type User = z.infer<typeof UserSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type ReactionType = z.infer<typeof ReactionEnum>;
