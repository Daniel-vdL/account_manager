# Account Manager

A secure, enterprise-grade user management system built with React Router 7, designed with CIS Control 5 compliance in mind. This application provides comprehensive CRUD operations for managing users, departments, roles, and permissions with a strong focus on security and audit trails.

## 🔐 Security Features

- **Role-Based Access Control (RBAC)** - Granular permission system
- **Session Management** - Auto-timeout and activity tracking
- **Input Validation** - Comprehensive form validation and sanitization
- **Audit Trail Ready** - Framework for logging all administrative actions
- **Password Security** - Strong password requirements and hashing
- **CSRF Protection** - Token-based protection framework

## 🚀 Features

### User Management
- Create, read, update, and delete users
- Block/unblock user accounts
- Assign roles and manage permissions
- Track user employment details
- Search and filter functionality

### Department Management
- Create and manage organizational departments
- Assign users to departments
- Department code validation
- User count tracking

### Authentication & Authorization
- Secure login system with demo credentials
- Session timeout management
- Permission-based UI rendering
- Activity tracking

### Dashboard & Analytics
- System statistics overview
- Recent activity monitoring
- Security alerts
- User status tracking

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Routing**: React Router 7
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: Bun
- **UI Components**: Custom component library

## 📦 Installation

Install dependencies using Bun:

```bash
bun install
```

## 🚀 Development

Start the development server:

```bash
bun run dev
```

Your application will be available at `http://localhost:5173`
