# URCSTIT Blog App

A blog/announcement application for class representatives to post updates.

## Features

- **Public Feed**: View announcements and comments.
- **Authentication**: User registration (requires confirmation), Login.
- **Roles**: User, Class Rep, Super Admin.
- **Admin Dashboard**:
  - Class Reps: Create announcements, manage users (confirm/blacklist).
  - Super Admin: Manage all users and posts.
- **Tech Stack**: Next.js, Tailwind CSS, Material UI, MongoDB, Zod.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env.local` file in the root directory with the following:
    ```env
    MONGODB_URI="mongodb://localhost:27017/blog_app"
    JWT_SECRET="your-secret-key"
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Create Super Admin**:
    You will need to manually insert the first Super Admin into the MongoDB database or use a seed script.
    Example MongoDB command:
    ```javascript
    db.users.insertOne({
      name: "Super Admin",
      email: "admin@example.com",
      password: "hashed_password_here", // Use bcrypt to hash "password123"
      role: "super_admin",
      isConfirmed: true,
      createdAt: new Date()
    })
    ```

## Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: React components (Navbar, PostList, etc.).
- `lib/`: Utilities (DB connection, Auth, Schemas).
- `public/`: Static assets.

## Design

The UI follows a Black, White, and Gold color scheme using Material UI and Tailwind CSS.
