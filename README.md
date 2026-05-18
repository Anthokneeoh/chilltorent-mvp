# 🏡 ChillToRent MVP

> A transparent, secure, and blazing-fast property rental marketplace designed for Lagos, Nigeria. Connect verified landlords with prospective tenants through clear move-in packages and direct chat channels.

![ChillToRent Preview](https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80)  ✨ Key Features

* **Role-Based Access Control:** Distinct, protected dashboard environments for Tenants, Landlords, and Admins.
* **Passwordless Authentication:** Secure OTP/Magic Link email authentication powered by Supabase Auth (with automatic role-based routing).
* **Smart Marketplace Feed:** Dynamic, URL-driven search engine with fallback data rendering. Filters instantly by location, property type (Flat, Duplex, Studio, etc.), and unit capacity.
* **Secure Infrastructure:** PostgreSQL backend locked down with strict Row Level Security (RLS) policies.
* **High-Performance Architecture:** Built on Next.js App Router utilizing aggressive prefetching, Suspense boundaries, and Server Components for instant load times.
* **Telemetry & Analytics:** Integrated PostHog custom event tracking to monitor conversion funnels (Signups, Listings, Viewings).

 🛠 Tech Stack

**Frontend**
* [Next.js 14+](https://nextjs.org/) (React Framework - App Router)
* [TypeScript](https://www.typescriptlang.org/)
* [Tailwind CSS](https://tailwindcss.com/) (Styling)
* [Lucide React](https://lucide.dev/) (Icons)
* [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (Form Validation)

**Backend & Infrastructure**
* [Supabase](https://supabase.com/) (PostgreSQL Database & Authentication)
* [Vercel](https://vercel.com/) (Hosting & CI/CD)
* [PostHog](https://posthog.com/) (Product Analytics)
* [Resend](https://resend.com/) (Custom SMTP for Auth Emails)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/) (v18.17 or higher)
* npm, yarn, or pnpm
* A Supabase Project

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/chilltorent-mvp.git](https://github.com/your-username/chilltorent-mvp.git)
   cd chilltorent-mvp
