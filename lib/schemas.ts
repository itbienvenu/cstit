import { z } from 'zod';

export const RoleEnum = z.enum(['student', 'class_rep', 'super_admin']);
export const UserStatusEnum = z.enum(['pending', 'active', 'rejected']);

export const OrganizationSchema = z.object({
    name: z.string().min(2, "Class name must be at least 2 characters"),
    code: z.string().min(4, "Class code must be unique and at least 4 chars").regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric"),
    createdAt: z.date().default(() => new Date()),
});

export const UserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: RoleEnum.default('student'),
    organizationId: z.string().optional(), // Super admin might not have one, or a specific system one
    status: UserStatusEnum.default('pending'),
    isBlacklisted: z.boolean().default(false),
    createdAt: z.date().default(() => new Date()),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const RegisterSchema = UserSchema.extend({
    classCode: z.string().optional(), // Required for students
});

export const CreateClassSchema = z.object({
    className: z.string().min(2),
    classCode: z.string().min(4).regex(/^[A-Z0-9]+$/),
    repName: z.string().min(2),
    repEmail: z.string().email(),
    repPassword: z.string().min(6),
});

export const ReactionEnum = z.enum(['like', 'love', 'haha', 'wow', 'sad', 'angry']);

export const PostSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    authorId: z.string(),
    authorName: z.string(),
    organizationId: z.string(), // Scoped to class
    className: z.string().optional(),
    classCode: z.string().optional(),
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
    parentId: z.string().optional().nullable(),
    createdAt: z.date().default(() => new Date()),
    reactions: z.array(z.object({
        userId: z.string(),
        userName: z.string(),
        type: ReactionEnum
    })).default([]),
});

export const MessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty"),
    senderId: z.string(),
    senderName: z.string(),
    recipientId: z.string(),
    organizationId: z.string(), // Scoped to class
    postId: z.string(),
    postTitle: z.string(),
    createdAt: z.date().default(() => new Date()),
    isRead: z.boolean().default(false),
});

export const ConversationSchema = z.object({
    participants: z.array(z.string()),
    organizationId: z.string(), // Scoped to class
    lastMessage: z.string().optional(),
    lastMessageAt: z.date().default(() => new Date()),
    unreadCounts: z.record(z.string(), z.number()).default({}),
});

export const ChatMessageSchema = z.object({
    conversationId: z.string(),
    senderId: z.string(),
    content: z.string(),
    createdAt: z.date().default(() => new Date()),
    readBy: z.array(z.string()).default([]),
    isEdited: z.boolean().default(false),
    isDeleted: z.boolean().default(false),
    deletedFor: z.array(z.string()).default([]),
});

export type User = z.infer<typeof UserSchema> & { _id?: string };
export type Organization = z.infer<typeof OrganizationSchema> & { _id?: string };
export type Post = z.infer<typeof PostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ReactionType = z.infer<typeof ReactionEnum>;
