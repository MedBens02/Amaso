# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Amaso Charitable Association Management System** - A comprehensive Arabic/RTL management system for a charitable organization handling orphans, widows, donors, and educational services.

**Architecture**: Full-stack application with Laravel backend API and Next.js frontend
- **Backend**: Laravel 12 with PHP 8.2+, MySQL database
- **Frontend**: Next.js 15.2.4, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: MySQL with comprehensive Arabic charity management schema

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend (Laravel)
```bash
cd backend
composer dev         # Start full development stack (server, queue, logs, vite)
composer test        # Run PHPUnit tests
php artisan serve    # Laravel development server only
php artisan test     # Run tests
php artisan migrate  # Run database migrations
php artisan migrate:fresh --seed  # Fresh migration with seeders
```

### Individual Backend Services
```bash
cd backend
php artisan serve           # Web server (port 8000)
php artisan queue:listen    # Queue worker
php artisan pail           # Real-time log monitoring
npm run dev                # Vite asset compilation
```

## Architecture & Key Concepts

### Full-Stack Structure
```
app/
├── frontend/           # Next.js React application
│   ├── app/           # App Router pages (Arabic RTL)
│   ├── components/    # UI components (shadcn/ui)
│   ├── lib/          # Utilities and API client
│   └── hooks/        # Custom React hooks
├── backend/          # Laravel API backend  
│   ├── app/Http/     # Controllers, Requests, Resources
│   ├── database/     # Migrations, seeders, factories
│   └── routes/       # API and web routes
└── amaso.sql        # Database schema reference
```

### Frontend Architecture
- **Language**: Arabic RTL layout with Cairo font
- **Routing**: Next.js App Router with nested layouts
- **State**: React Hook Form + Zod validation
- **UI**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with RTL configuration
- **Theme**: Light/dark theme support via next-themes

### Key Frontend Components
- **Forms**: Complex multi-step forms (NewIncomeForm, NewExpenseForm, NewTransferForm)
- **Tables**: Data tables for donors, incomes, expenses, transfers
- **Dashboard**: Stats cards, recent activity, sidebar navigation
- **Dialogs**: Add/edit dialogs for various entities

### Backend Architecture (Laravel)
- **API**: RESTful API at `/api/v1/` endpoints
- **Database**: MySQL with comprehensive charity management schema
- **Auth**: Laravel Sanctum for API authentication
- **Testing**: PHPUnit with SQLite in-memory for tests
- **Development**: Concurrently runs server, queue, logs, and vite

### Database Schema Highlights
Key entities from `amaso.sql`:
- **Core**: `donors`, `kafils`, `widows`, `orphans`, `families`
- **Financial**: `incomes`, `expenses`, `transfers`, `bank_accounts`, `fiscal_years`
- **Relationships**: `kafil_sponsorship`, `expense_beneficiaries`
- **Lookups**: `skills`, `illnesses`, `aid_types`, `housing_types`, `partners`
- **Workflow**: Draft/Approved status for financial transactions

## Development Patterns

### Frontend Form Patterns
All forms use react-hook-form + zod with Arabic validation messages:
```typescript
const schema = z.object({
  field: z.string().min(1, "هذا الحقل مطلوب"), // Arabic validation
})
```

Forms include conditional validation based on selection (e.g., payment method affects required fields).

### API Integration Pattern
Forms are structured to call Laravel API endpoints but currently use mock data. The expected API client pattern:
```typescript
// Expected: API calls to backend
const response = await fetch('/api/v1/incomes', {
  method: 'POST',
  body: JSON.stringify(formData)
})
```

### Component Organization
- Complex forms in `components/forms/`
- Entity-specific components in `components/[entity]/`
- Reusable UI in `components/ui/`
- Shared utilities in `lib/`

## Key Integration Points

### Frontend-Backend Integration
- Frontend expects REST API at `http://localhost:8000/api/v1/`
- JSON responses with consistent error format
- Pagination for list endpoints
- Authentication via Sanctum tokens

### Database Integration
- Laravel models should match `amaso.sql` schema
- Foreign key relationships preserved
- Enum fields handled properly
- Arabic text support (utf8mb4 collation)

## Development Notes

### Arabic/RTL Considerations
- All text is in Arabic
- RTL layout using `dir="rtl"`
- Date formatting uses Arabic locale
- Form labels and validation messages in Arabic

### Current State
- **Frontend**: Fully functional with mock data
- **Backend**: Basic Laravel skeleton, needs API implementation
- **Database**: Schema available in `amaso.sql`, needs Laravel migrations
- **Integration**: Not yet connected, forms submit to mock handlers

### Testing
- **Frontend**: No specific test setup mentioned
- **Backend**: PHPUnit configured with SQLite in-memory database
- Tests should cover both Arabic text handling and complex business logic

## Development Workflow

1. **Backend Development**: Start with database migrations from `amaso.sql`
2. **API Development**: Implement REST endpoints matching frontend expectations
3. **Integration**: Replace mock data calls with real API integration
4. **Testing**: Ensure Arabic text, RTL layout, and complex relationships work correctly

## Special Considerations

- **Multi-language**: Primarily Arabic with RTL support
- **Complex Relationships**: Kafil-widow sponsorship, beneficiary groups
- **Financial Tracking**: Approval workflows, balance validation
- **Charitable Context**: Specialized business logic for charitable operations