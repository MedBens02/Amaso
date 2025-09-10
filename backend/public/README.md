# Amaso Charitable Association Management System

نظام إدارة جمعية أماسو الخيرية - نظام شامل باللغة العربية لإدارة المؤسسات الخيرية

A comprehensive Arabic/RTL management system for charitable organizations handling orphans, widows, donors, and educational services.

## 🌟 Features

### Core Functionality
- **👥 Donor Management**: Complete donor database with contact information and donation history
- **🤝 Kafil (Sponsor) System**: Advanced sponsorship management with multiple widow support
- **👩‍👧‍👦 Widow Management**: Comprehensive widow profiles and support tracking
- **👶 Orphan Management**: Child care and support tracking system
- **💰 Financial Management**: Income, expense, and transfer tracking with approval workflows
- **📊 Reporting**: Comprehensive reporting and analytics dashboard

### Advanced Sponsorship Features
- **Multiple Sponsorships**: One kafil can sponsor multiple widows with individual amounts
- **Budget Validation**: Real-time validation ensuring sponsorship amounts don't exceed monthly pledges
- **Sponsor Conversion**: Convert regular donors to kafils and vice versa
- **Sponsorship Management**: Add, edit, remove individual sponsorships with full audit trail

### Technical Features
- **Arabic RTL Support**: Full right-to-left layout with Arabic text
- **Responsive Design**: Mobile-first responsive design using Tailwind CSS
- **Real-time Validation**: Form validation with Arabic error messages
- **API-First Architecture**: RESTful API backend with comprehensive endpoints
- **Database Transactions**: Atomic operations ensuring data integrity

## 🏗️ Architecture

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

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.2.4 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS with RTL configuration
- **UI Components**: shadcn/ui with Radix UI primitives
- **Form Management**: React Hook Form + Zod validation
- **State Management**: React hooks (useState, useEffect)
- **Theme**: Light/dark theme support via next-themes
- **Font**: Cairo font for Arabic text

#### Backend
- **Framework**: Laravel 12 with PHP 8.2+
- **Database**: MySQL with comprehensive charity management schema
- **Authentication**: Laravel Sanctum for API authentication
- **Testing**: PHPUnit with SQLite in-memory for tests
- **API**: RESTful API at `/api/v1/` endpoints

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **PHP** 8.2+
- **Composer**
- **MySQL** 5.7+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd amaso-management-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   
   # Configure database in .env file
   php artisan migrate
   php artisan db:seed
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   # Configure API base URL if needed
   ```

### Development

#### Start Backend Services
```bash
cd backend
composer dev          # Full development stack (recommended)
# OR individually:
php artisan serve     # Web server (port 8000)
php artisan queue:listen    # Queue worker
php artisan pail     # Real-time log monitoring
npm run dev          # Vite asset compilation
```

#### Start Frontend
```bash
cd frontend
npm run dev          # Development server (port 3000)
```

#### Available Scripts

**Frontend**:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

**Backend**:
- `composer dev` - Start full development stack
- `composer test` - Run PHPUnit tests
- `php artisan test` - Run tests
- `php artisan migrate` - Run database migrations
- `php artisan migrate:fresh --seed` - Fresh migration with seeders

## 📊 Database Schema

### Key Entities
- **Core**: `donors`, `kafils`, `widows`, `orphans`
- **Financial**: `incomes`, `expenses`, `transfers`, `bank_accounts`, `fiscal_years`
- **Relationships**: `kafil_sponsorship`, `expense_beneficiaries`
- **Lookups**: `skills`, `illnesses`, `aid_types`, `housing_types`, `partners`
- **Workflow**: Draft/Approved status for financial transactions

### Key Relationships
- **Donors ↔ Kafils**: One-to-one relationship when donor becomes kafil
- **Kafils ↔ Widows**: Many-to-many through `kafil_sponsorship` with individual amounts
- **Expenses ↔ Beneficiaries**: Many-to-many for expense distribution

## 🎯 Key Features Implementation

### Multiple Sponsorship System
```typescript
// Real-time budget tracking
const totalSponsorships = sponsoredWidows.reduce((sum, s) => sum + s.amount, 0)
const remainingAmount = monthlyPledge - totalSponsorships

// Validation ensures no over-allocation
if (totalSponsorships > monthlyPledge) {
  // Show error in Arabic
}
```

### Donor-Kafil Conversion
```typescript
// Convert donor to kafil workflow
const handleConvertToKafil = (donor) => {
  // Pre-fill form with donor data
  // Enable kafil functionality
  // Create sponsorship relationships
}

// Convert kafil back to donor
const handleRemoveKafilStatus = (kafil) => {
  // Remove all sponsorships
  // Delete kafil record
  // Update donor status
}
```

### Arabic Form Validation
```typescript
const schema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  monthlyPledge: z.number().positive("التعهد الشهري يجب أن يكون موجباً"),
})
```

## 🔧 API Endpoints

### Donors & Kafils
- `GET /api/v1/donors` - List donors
- `POST /api/v1/donors` - Create donor
- `GET /api/v1/kafils/{id}` - Get kafil details
- `POST /api/v1/kafils` - Create kafil with sponsorships
- `POST /api/v1/kafils/{id}/remove-status` - Convert kafil to donor

### Sponsorship Management
- `POST /api/v1/kafils/{kafil}/sponsorships` - Add sponsorship
- `PUT /api/v1/kafils/{kafil}/sponsorships/{id}` - Update sponsorship
- `DELETE /api/v1/kafils/{kafil}/sponsorships/{id}` - Remove sponsorship

### Financial Management
- `GET /api/v1/incomes` - List incomes
- `POST /api/v1/expenses` - Create expense
- `POST /api/v1/transfers/{id}/approve` - Approve transfer

## 🎨 UI Components

### Key Components
- **Forms**: Complex multi-step forms with Arabic validation
- **Tables**: Data tables with Arabic headers and RTL layout
- **Dialogs**: Add/edit dialogs for various entities
- **Sheets**: Large forms with multiple sections
- **Dashboard**: Stats cards and recent activity

### Component Architecture
```
components/
├── donors/          # Donor management components
├── kafils/          # Kafil-specific components
├── widows/          # Widow management
├── forms/           # Reusable form components
└── ui/              # shadcn/ui components
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
php artisan test      # Run all tests
composer test        # Alternative command
```

### Frontend Testing
Currently no specific test setup. Future implementation planned.

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build
npm run start

# Backend
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Environment Configuration
- Configure database connection in `.env`
- Set `NEXT_PUBLIC_API_BASE_URL` in frontend
- Configure Laravel Sanctum for API authentication

## 🔒 Security Features

- **Input Validation**: Comprehensive validation on both frontend and backend
- **SQL Injection Protection**: Laravel Eloquent ORM with parameter binding
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Laravel CSRF tokens
- **API Authentication**: Laravel Sanctum token-based authentication

## 🌍 Internationalization

- **Primary Language**: Arabic (العربية)
- **Layout**: Right-to-left (RTL) support
- **Font**: Cairo font family optimized for Arabic text
- **Date Formatting**: Arabic locale formatting
- **Number Formatting**: Arabic number formatting

## 📝 Development Notes

### Code Patterns
- **API Error Handling**: Consistent error handling with Arabic messages
- **Form Management**: React Hook Form + Zod validation pattern
- **Component Organization**: Feature-based component structure
- **Database Transactions**: Atomic operations for data integrity

### Current State
- ✅ Frontend: Fully functional with real API integration
- ✅ Backend: Complete API implementation with Laravel
- ✅ Database: Full schema implemented with relationships
- ✅ Integration: Frontend and backend fully connected

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code patterns and conventions
- Write Arabic validation messages for user-facing errors
- Maintain RTL layout consistency
- Test both frontend and backend changes
- Document any new API endpoints

## 📄 License

This project is proprietary software developed for Amaso Charitable Association.

## 📧 Support

For support and inquiries, please contact the development team.

---

**Built with ❤️ for charitable work**  
*نُبني بالحب من أجل العمل الخيري*