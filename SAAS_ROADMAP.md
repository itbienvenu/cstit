# SaaS Transformation Roadmap

Transforming the URCSTIT Blog App into a multi-tenant SaaS platform requires structural changes to support multiple organizations (classes/groups) simultaneously.

## Phase 1: Core Architecture & Database (Multi-tenancy)
**Goal:** Isolate data so different classes don't see each other's data.

1.  **New `Organization` Schema**:
    *   Attributes: `name`, `slug` (for URLs like `class-a.app.com`), `logo`, `ownerId`.
    *   Settings: `themeColors`, `allowPublicPosts`, etc.
2.  **Schema Updates**:
    *   Update `User`, `Post`, `Comment`, `Message`, `Conversation` to include `organizationId`.
    *   Update `RoleEnum` to be organization-specific (e.g., `org_admin`, `org_member`) plus a system-wide `super_admin`.
3.  **Data Migration**:
    *   Create a default "General" organization for existing data.

## Phase 2: Authentication & Onboarding
**Goal:** Allow users to sign up and create a new Class/Organization.

1.  **Registration Flow**:
    *   "Create a new Class" vs "Join an existing Class".
    *   On "Create": User creates an account AND an Organization. User becomes `org_admin`.
    *   On "Join": User enters an invite code or searches for a class.
2.  **Context Switching**:
    *   Middleware to detect current organization from URL (subdomain or path) or session.

## Phase 3: Application Logic (The "SaaS-ification")
**Goal:** Ensure every API call is scoped to the current organization.

1.  **Middleware / API Wrappers**:
    *   Global check: `where: { organizationId: currentOrg.id }` for ALL database queries.
    *   Prevent data leaks between tenants.
2.  **Refactor APIs**:
    *   Refactor `/api/posts`, `/api/chat`, etc., to require and validate `organizationId`.

## Phase 4: Billing & Subscriptions
**Goal:** Monetize the platform.

1.  **Integration**: Stripe or LemonSqueezy.
2.  **Models**: `Subscription` schema linked to `Organization`.
3.  **Features**:
    *   Free Tier: Limit users or storage.
    *   Pro Tier: Unlimited history, custom branding, priority support.
4.  **Gating**: Check subscription status before allowing actions (e.g., "Upgrade to add more than 50 members").

## Phase 5: Super Admin & Marketing
**Goal:** Manage the platform.

1.  **SaaS Admin Dashboard**: View all organizations, total revenue, global user count.
2.  **Landing Page**: A generic home page (`/`) selling the tool, while the app lives at `/app` or `app.domain.com`.

---
**Recommended First Step:** Phase 1 - Database Schema Updates.
