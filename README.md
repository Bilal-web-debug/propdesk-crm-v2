# 🏢 PropDesk CRM - PropTech Project Management System

A modern, full-stack CRM and Project Management system built specifically for the real estate industry. PropDesk CRM helps property managers, agents, and agencies manage properties, customers, leads, projects, and tasks seamlessly.

![PropDesk CRM Banner](https://your-live-url.vercel.app/banner.png) <!-- Replace with actual screenshot -->

## 🚀 Live Demo
- **Live URL:** [https://propdesk-app-plum.vercel.app](https://propdesk-app-plum.vercel.app) *(Update if different)*
- **Demo Email:** `admin@propdesk.com` 
- **Demo Password:** `password123`

## ✨ Key Features

- **🔐 Secure Authentication:** Login, Registration, and Session Management using Supabase Auth.
- **📊 Interactive Dashboard:** Real-time statistics and beautiful Area Charts for Sales & Leads using Recharts.
- **🏠 Property Management:** Full CRUD operations, image uploads (Supabase Storage), search, and filters.
- **👥 Customer & Lead Management:** Track clients, assign properties, and manage sales pipelines with priority statuses.
- **📁 Project & Task Tracking:** Manage real estate projects, assign tasks, and track due dates.
- **📄 PDF Reports:** Export Properties and Leads data into professional PDF documents.
- **🛡️ Role-Based Access Control (RBAC):** Admin and Agent roles. Only Admins can delete records.
- **🌙 Dark Mode:** Premium dark theme toggle for better user experience.
- **📱 Fully Responsive:** Optimized for desktop, tablet, and mobile screens.

## 💻 Tech Stack

**Frontend:**
- React.js (Vite)
- Tailwind CSS (v4)
- React Router DOM
- Lucide React (Icons)
- Recharts (Analytics)
- React Hot Toast (Notifications)

**Backend & Database:**
- Supabase
- PostgreSQL (Relational Database)
- Supabase Authentication
- Supabase Storage (Image uploads)
- Row Level Security (RLS) Policies

**Deployment:**
- Vercel (CI/CD)

## 🗄️ Database Architecture

The application uses a relational PostgreSQL database with the following tables:
1. `profiles` (User data & roles)
2. `properties` (Real estate listings)
3. `customers` (Client details)
4. `leads` (Sales pipeline)
5. `projects` (Development projects)
6. `tasks` (Project tasks)

## ⚙️ Local Setup Instructions

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/your-username/propdesk-crm.git
   \`\`\`
2. Navigate to the project folder:
   \`\`\`bash
   cd propdesk-crm
   \`\`\`
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Create a `.env` file in the root directory and add your Supabase credentials:
   \`\`\`env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`
5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## 🔒 Security Note
This project implements strict Row Level Security (RLS) policies on Supabase. No API keys or secrets are exposed in the frontend. The `anon` key used is safe for public distribution, while all sensitive data access is protected at the database level.

---
*Built with ❤️ by [Muhammad Bilal]*