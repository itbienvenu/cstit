# URCSTIT Blog App

A specialized, feature-rich blog application designed for the URCSTIT class. This project combines a robust content management system with a distinct "Hacker/Geek" aesthetic, tailored for IT students.

![Hacker Aesthetic](https://img.shields.io/badge/Style-Hacker%20Geek-00ff00?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
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

### 🏢 Multi-Tenant SaaS Architecture
-   **Class Isolation**: Data (posts, students, chats) is isolated by **Class Code**. A "Class" acts as a tenant.
-   **Hierarchical Structure**:
   -   **Super Admin**: Creates Classes (`Organization`) and assigns the first Class Representative.
   -   **Class Representative**: The admin for a specific class. Manages student approvals and posts announcements.
   -   **Student**: Joins a class using a unique `Class Code`. Can only see data relevant to their class.

### 🎨 UI/UX & Aesthetic
-   **Hacker Theme**: Dark glassmorphism interface with neon green (`#00ff00`) accents.
-   **Animated Background**: Custom `HackerBackground` component featuring:
    -   Matrix Rain effect (Canvas).
    -   Floating dashed data nodes.
    -   Glowing atmospheric orbs.
-   **Terminal Vibes**: Monospaced fonts (`Roboto Mono`), blinking cursor animations on titles.
-   **Hacker Simulator**: A fun, interactive page (`/hacker-simulator`) that simulates a Hollywood-style hacking sequence.

### 🔐 Authentication & Roles
-   **Secure Auth**: JWT-based authentication.
-   **Registration Flow**: Students must provide a valid **Class Code** during signup. Accounts remain `pending` until approved by the Class Rep.
-   **Role-Based Access Control (RBAC)**: Strictly enforced at both UI and API levels.

### ⚙️ Admin Dashboard
-   **Super Admin View**:
    -   Create new Classes (Organizations).
    -   Onboard Class Representatives.
-   **Class Rep View**:
    -   **Student Management**: Approve/Reject pending registrations.
    -   **Blacklist**: Block distinct students with reasons sent via email.
    -   **Announcements**: Create posts scoped specifically to their class.
-   **Safety Features**:
    -   **Undo Action**: 5-second timer to undo deletions or blacklisting actions.

### 💬 Chat & Social
-   **ClassChat**: Real-time messaging restricted to members of the same class.
-   **Reactions**: Like, Love, Haha, etc., on announcements.
-   **Comments**: Threaded discussions on posts.

### 📧 Notifications
-   Automated emails sent via SMTP when:
    -   A user account is **Blocked** (includes the reason).
    -   A user account is **Restored**.
    -   High-priority announcements are posted (optional).

## 📂 Folder Structure

```
URCSTIT/blog_app/
├── app/                    # Next.js App Router
│   ├── admin/              # Dashboard (Super Admin & Class Rep views)
│   ├── api/                # API Routes (posts, users, auth, classes, etc.)
│   ├── chats/              # Real-time chat interface
│   ├── docs/               # Documentation page
│   ├── login/              # Login page
│   ├── register/           # Registration with Class Code
│   ├── globals.css         # Global styles & animations
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (Public Feed + Class Code Filter)
├── components/             # Reusable UI Components
│   ├── Footer.tsx          # Site footer with credits
│   ├── HackerBackground.tsx# Animated background
│   ├── Navbar.tsx          # Navigation
│   ├── PostList.tsx        # Smart feed with filtering
│   └── ...
├── lib/                    # Utilities & Helpers
│   ├── auth.ts             # Auth helpers
│   ├── db.ts               # MongoDB connection
│   ├── cache.ts            # LRU Cache for organization lookups
│   └── email.ts            # Nodemailer configuration
└── public/                 # Static assets
```

## ⚡ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/itbienvenu/cstit.git
    cd cstit
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    MONGODB_URI=mongodb+srv://...
    JWT_SECRET=your_jwt_secret
    SMTP_EMAIL=your_email@gmail.com
    SMTP_PASSWORD=your_app_specific_password
    ENCRYPTION_KEY=32_byte_hex_string_for_chat_encryption
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open the app**:
    Visit `http://localhost:3000` in your browser.

## 🧠 Core Logic Overview

-   **Filtering**: The Home page (`/`) allows public visitors to filter announcements by **Class Code**. The API performs a strict lookup: `Class Code` -> `Organization ID` -> `Posts`.
-   **Data Isolation**: All critical data (Posts, Messages, Users) is tagged with an `organizationId`. The API Middleware and Route Handlers automatically filter queries based on the logged-in user's organization.
-   **Caching**: `lru-cache` is used to store Organization details to minimize database queries during high-traffic filtering.

---
*Happy Coding! >_*
