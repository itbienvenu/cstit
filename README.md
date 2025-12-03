# URCSTIT Blog App

A specialized, feature-rich blog application designed for the URCSTIT class. This project combines a robust content management system with a distinct "Hacker/Geek" aesthetic, tailored for IT students.

![Hacker Aesthetic](https://img.shields.io/badge/Style-Hacker%20Geek-00ff00?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![MUI](https://img.shields.io/badge/MUI-v5-007FFF?style=for-the-badge&logo=mui)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)

## 🚀 Project Overview

The URCSTIT Blog App serves as a central hub for class announcements and discussions. It features a custom-built "Hacker" theme with animated backgrounds (Matrix rain, floating nodes), neon accents, and terminal-inspired typography. Beyond the visuals, it includes a comprehensive Admin Dashboard for managing users and content, complete with email notifications and safety features like "Undo" for deletions.

## 🛠️ Technology Stack

### Frontend
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **UI Library**: [Material UI (MUI)](https://mui.com/) v5
-   **Styling**: Custom MUI Theme (Dark Mode), Tailwind CSS, CSS Modules
-   **Animations**: CSS Keyframes, HTML5 Canvas (Matrix Effect)

### Backend
-   **API**: Next.js Serverless API Routes
-   **Database**: MongoDB (via native driver)
-   **Authentication**: JWT (JSON Web Tokens) using `jose` library
-   **Email Service**: Nodemailer (SMTP)

## ✨ Key Features

### 🎨 UI/UX & Aesthetic
-   **Hacker Theme**: Dark glassmorphism interface with neon green (`#00ff00`) accents.
-   **Animated Background**: Custom `HackerBackground` component featuring:
    -   Matrix Rain effect (Canvas).
    -   Floating dashed data nodes.
    -   Glowing atmospheric orbs.
-   **Terminal Vibes**: Monospaced fonts (`Roboto Mono`), blinking cursor animations on titles.
-   **Hacker Simulator**: A fun, interactive page (`/hacker-simulator`) that simulates a Hollywood-style hacking sequence.

### 🔐 Authentication & Roles
-   **Secure Auth**: JWT-based authentication with HTTP-only cookie support (via Middleware).
-   **Role-Based Access Control (RBAC)**:
    -   **Super Admin**: Full system access.
    -   **Class Rep**: Can manage users (confirm/blacklist) and post announcements.
    -   **User**: Can view posts, comment, and react.

### ⚙️ Admin Dashboard
-   **User Management**:
    -   Confirm new registrations.
    -   **Blacklist/Unblacklist**: Block users with a specific reason. Includes email notifications.
    -   Delete users.
-   **Content Management**: Create, Edit, and Delete announcements.
-   **Safety Features**:
    -   **Undo Action**: 5-second timer to undo deletions or blacklisting actions.
    -   **Optimistic Updates**: UI updates immediately for a snappy feel.

### 📧 Notifications
-   Automated emails sent via SMTP when:
    -   A user account is **Blocked** (includes the reason).
    -   A user account is **Restored**.

## 📂 Folder Structure

```
URCSTIT/blog_app/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin Dashboard page
│   ├── api/                # API Routes (posts, users, auth, etc.)
│   ├── hacker-simulator/   # "Become a Hacker" page
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── globals.css         # Global styles & animations
│   ├── layout.tsx          # Root layout (includes Background & Navbar)
│   └── page.tsx            # Home page (Post feed)
├── components/             # Reusable UI Components
│   ├── Footer.tsx          # Site footer
│   ├── HackerBackground.tsx# Animated background component
│   ├── Navbar.tsx          # Responsive navigation bar
│   ├── PostCard.tsx        # Individual post display
│   ├── PostList.tsx        # Feed of posts
│   └── ThemeRegistry/      # MUI Theme configuration
├── lib/                    # Utilities & Helpers
│   ├── auth.ts             # Auth helpers
│   ├── db.ts               # MongoDB connection
│   └── email.ts            # Nodemailer configuration
├── middleware.ts           # Edge middleware for route protection
└── public/                 # Static assets
```

## ⚡ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd blog_app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory with the following keys:
    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/blog_app
    JWT_SECRET=your_super_secret_jwt_key
    SMTP_EMAIL=your_email@gmail.com
    SMTP_PASSWORD=your_app_specific_password
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open the app**:
    Visit `http://localhost:3000` in your browser.

## 🧠 Core Logic Overview

-   **Middleware (`middleware.ts`)**: Intercepts requests to protected routes (`/admin`, `/api/posts` [POST/DELETE]). Verifies the JWT token and checks user roles before allowing access.
-   **Theming (`ThemeRegistry`)**: Wraps the application in a custom MUI Theme Provider. It overrides default MUI styles to enforce the dark, neon, sharp-edged "hacker" look.
-   **API Routes**:
    -   `GET /api/posts`: Fetches posts. Supports search queries.
    -   `PUT /api/users`: Handles user updates (confirm, blacklist). Triggers email sending logic if status changes.
    -   `DELETE /api/posts`: Soft/Hard deletion logic (handled by frontend delay).

---
*Happy Coding! >_*
