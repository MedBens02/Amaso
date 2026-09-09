# 🏛️ Amaso Charitable Association Management System
## نظام إدارة جمعية أماسو الخيرية

<div align="center">

![Arabic](https://img.shields.io/badge/Language-Arabic_RTL-green)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)
![Laravel](https://img.shields.io/badge/Laravel-12-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)

*A comprehensive Arabic/RTL management system for charitable organizations*

</div>

---

## 📋 Overview

Amaso is a complete management system designed specifically for charitable organizations in Arabic-speaking regions. The system handles complex operations including beneficiary management, financial tracking, sponsorship programs, and comprehensive reporting - all with full Arabic language support and RTL (Right-to-Left) layout.

## 🌟 Core Features

### 👥 **Beneficiary Management**
- **Widow Management**: Complete profiles with family information, housing details, health status, and support history
- **Orphan Management**: Integrated child records linked to widows with education tracking and age monitoring
- **Family Relationships**: Automatic family linking and dependency tracking
- **Medical Records**: Health status tracking and medical history
- **Educational Progress**: School enrollment and academic level monitoring

### 🤝 **Advanced Sponsorship System**
- **Kafil (Sponsor) Management**: Comprehensive donor-to-sponsor conversion system
- **Multiple Sponsorships**: One sponsor can support multiple widows with individual amounts
- **Budget Validation**: Real-time validation preventing over-allocation of sponsor funds
- **Sponsorship History**: Complete audit trail of all sponsorship changes
- **Flexible Amounts**: Different support amounts per widow based on needs

### 💰 **Financial Management**
- **Income Tracking**: Multi-source income recording with approval workflows
- **Expense Management**: Detailed expense tracking with beneficiary distribution
- **Bank Account Integration**: Multiple bank account management with balance tracking
- **Transfer System**: Inter-account transfers with approval processes
- **Fiscal Year Management**: Annual financial periods with closing procedures
- **Financial Reporting**: Comprehensive financial reports and analytics

### 🖨️ **Reports & PDFs**
- **Real-text PDFs**: rendered server-side with mPDF from Blade templates — selectable, searchable and editable, not a screenshot. A four-page ranking is ~60 KB
- **Arabic typesetting**: Noto Naskh Arabic is bundled, with DejaVu as the fallback for Latin and symbols; contextual shaping and RTL are handled natively
- **Branding**: the association's logo and name head every report, print view and card, from `config/organization.php`
- **Server-side aggregates**: report totals are SQL aggregates over every row, not a client-side sum of the first 1,000

### 📊 **Accounting & Budgeting**
- **Budgets**: Named funds money is booked into and spent out of, one of them the default; the seven kafala chamila budgets are fixed and cannot be edited or deleted
- **Chart of Accounts**: Income/expense categories that classify a transaction, nestable one level deep and independent of the budget it hits
- **Approval Workflows**: Multi-level approval system for financial transactions
- **Budget Monitoring**: Real-time budget utilization tracking
- **Financial Controls**: Validation rules and spending limits

### 🏫 **Educational Services**
- **Education Level Tracking**: Comprehensive academic progress monitoring
- **School Information**: Institutions carry their stage (school vs. university) and sector (public/private, AMASO-partnered)
- **Enrollments**: One record per student per academic year — level, institution, specialty, result — opened from the family form and promoted by the year-end rollover
- **Semester Grades**: Both semesters recorded per enrollment on a per-enrollment scale (out of 20 by default), with the year's average derived from them
- **School Performance Report**: Students ranked by percentage, filterable by gender, academic year, level, institution, public/private, higher education and top N — for excellence awards
- **Academic Support**: Educational assistance and scholarship management

### 👨‍👩‍👧‍👦 **Beneficiary Groups**
- **Group Management**: Organize beneficiaries into logical groups
- **Bulk Operations**: Mass actions on beneficiary groups
- **Group-based Distributions**: Distribute aid based on group membership
- **Custom Grouping**: Flexible grouping criteria and management

### 📈 **Reporting & Analytics**
- **Dashboard Analytics**: Real-time statistics and key performance indicators
- **Financial Reports**: Income statements, expense reports, and balance summaries  
- **Beneficiary Reports**: Comprehensive beneficiary analytics and demographics
- **Export Capabilities**: CSV export and printable reports
- **Custom Filters**: Advanced filtering and search capabilities

### 🔧 **Administrative Features**
- **Reference Data Management**: Skills, illnesses, aid types, housing types
- **Partner Management**: External partner and organization tracking
- **User Management**: Multi-user system with role-based access (planned)
- **System Configuration**: Configurable system settings and parameters

## 🏗️ System Architecture

### Technology Stack

#### 🖥️ Frontend (Next.js)
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with RTL configuration
- **UI Components**: shadcn/ui built on Radix UI primitives  
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks (useState, useEffect, useContext)
- **Internationalization**: Arabic RTL support with Cairo font
- **Date Handling**: date-fns with Arabic locale

#### ⚙️ Backend (Laravel)
- **Framework**: Laravel 12 with PHP 8.2+
- **Database**: MySQL 8.0+ with comprehensive schema
- **Authentication**: Laravel Sanctum for API security
- **Testing**: PHPUnit with SQLite in-memory testing
- **API**: RESTful API architecture at `/api/v1/`
- **Queue System**: Laravel Queues for background processing
- **Validation**: Form Request classes with Arabic error messages

#### 🗄️ Database Design
```
Core Tables (45 total):
├── People & Relationships
│   ├── donors (المتبرعين)
│   ├── kafils (الكفلاء) 
│   ├── widows (الأرامل)
│   ├── orphans (الأيتام)
│   └── kafil_sponsorship (الكفالات)
├── Financial Management  
│   ├── incomes (الإيرادات)
│   ├── expenses (المصروفات)
│   ├── transfers (التحويلات)
│   ├── bank_accounts (الحسابات البنكية)
│   └── fiscal_years (السنوات المالية)
├── Accounting Structure
│   ├── budgets (الميزانيات)
│   ├── income_categories (فئات الإيرادات)
│   ├── expense_categories (فئات المصروفات)
│   └── expense_beneficiaries (مستفيدي المصروفات)
├── Groups & Education
│   ├── beneficiary_groups (مجموعات المستفيدين)
│   ├── beneficiary_group_members (أعضاء المجموعات)
│   ├── orphans_education_levels (مستويات التعليم)
│   ├── schools (المؤسسات التعليمية)
│   ├── academic_years (السنوات الدراسية)
│   └── orphan_enrollments (التسجيلات — بنقط الأسدسين)
└── Reference Data
    ├── skills (المهارات)
    ├── illnesses (الأمراض) 
    ├── aid_types (أنواع المساعدات)
    ├── housing_types (أنواع السكن)
    └── partners (الشركاء)
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ with npm
- **PHP** 8.2+ with Composer
- **MySQL** 8.0+
- **Git** for version control

### 🔧 Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd amaso-management-system
```

#### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env

# Configure database connection in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=amaso
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Generate application key and run migrations
php artisan key:generate
php artisan migrate --seed
```

#### 3. Frontend Setup  
```bash
cd frontend
npm install
cp .env.local.example .env.local

# Configure API endpoint in .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### 🏃‍♂️ Running the Application

#### Development Mode

**Backend Services:**
```bash
cd backend
composer dev    # Starts all services (recommended)

# Or run individually:
php artisan serve     # API server (port 8000)
php artisan queue:work # Background jobs  
php artisan pail      # Log monitoring
npm run dev          # Asset compilation
```

**Frontend Server:**
```bash
cd frontend
npm run dev    # Development server (port 3000)
```

#### Production Deployment
```bash
# Frontend build
cd frontend
npm run build
npm run start

# Backend optimization
cd backend  
php artisan config:cache
php artisan route:cache
php artisan view:cache
composer install --no-dev --optimize-autoloader
```

## 📱 User Interface Features

### 🎨 Design System
- **Arabic RTL Layout**: Complete right-to-left interface design
- **Cairo Font**: Optimized Arabic typography
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Themes**: System-wide theme support
- **Accessible UI**: WCAG compliant interface elements

### 📋 Key Screens

#### Dashboard (لوحة التحكم)
- Real-time statistics and KPIs
- Recent activity feeds
- Quick action buttons
- Monthly financial charts
- System health indicators

#### Donor Management (إدارة المتبرعين)
- Donor registry with full contact information
- Donation history and patterns
- Convert donors to sponsors (kafils)
- Advanced search and filtering

#### Sponsor Management (إدارة الكفلاء) 
- Sponsor profiles with monthly commitments
- Multiple widow sponsorship management
- Real-time budget allocation tracking
- Sponsorship history and changes

#### Widow & Orphan Management (إدارة الأرامل والأيتام)
- Comprehensive family profiles
- Medical and educational records
- Housing and living situation tracking
- Support history and current status

#### Financial Management (الإدارة المالية)
- Income registration and approval
- Expense tracking and distribution
- Bank account reconciliation
- Inter-account transfers
- Financial reporting and analytics

## 🔌 API Documentation

### Core Endpoints

#### Authentication & Health
```http
GET  /api/health                    # System health check
GET  /api/user                      # Current user info
```

#### Beneficiary Management
```http
GET    /api/v1/widows               # List widows
POST   /api/v1/widows               # Create widow
PUT    /api/v1/widows/{id}          # Update widow
DELETE /api/v1/widows/{id}          # Delete widow
GET    /api/v1/orphans              # List orphans (read-only)
GET    /api/v1/beneficiaries        # Combined beneficiaries
```

#### Donor & Sponsor Management
```http
GET    /api/v1/donors               # List donors
POST   /api/v1/donors               # Create donor  
GET    /api/v1/kafils               # List sponsors
POST   /api/v1/kafils               # Create sponsor
POST   /api/v1/kafils/{id}/remove-status # Convert sponsor to donor
POST   /api/v1/sponsorships         # Create sponsorship
```

#### Financial Operations
```http
GET    /api/v1/incomes              # List incomes
POST   /api/v1/incomes              # Create income
POST   /api/v1/incomes/{id}/approve # Approve income
GET    /api/v1/expenses             # List expenses  
POST   /api/v1/expenses             # Create expense
POST   /api/v1/expenses/{id}/approve # Approve expense
GET    /api/v1/transfers            # List transfers
POST   /api/v1/transfers/{id}/approve # Approve transfer
```

#### Reference Data Management
```http
GET    /api/v1/references/skills           # Skills reference
GET    /api/v1/references/illnesses        # Illnesses reference
GET    /api/v1/references/aid-types        # Aid types reference
GET    /api/v1/references/education-levels # Education levels
GET    /api/v1/enrollments                 # Enrollments for an academic year
POST   /api/v1/enrollments/grades          # Bulk semester-grade entry
GET    /api/v1/reports/school-performance  # Ranked school performance
GET    /api/v1/reports/{report}            # widows | financial | donors | annual
GET    /api/v1/reports/{report}.pdf        # the same report as a real-text PDF
GET    /api/v1/cards/{entity}/{id}.pdf     # per-entity information card
GET    /api/v1/references/partners         # Partner organizations
```

#### Accounting & Configuration  
```http
GET    /api/v1/fiscal-years          # Fiscal year periods
GET    /api/v1/budgets               # Budgets (funds)
GET    /api/v1/income-categories     # Income classifications
GET    /api/v1/expense-categories    # Expense classifications
GET    /api/v1/bank-accounts         # Bank account list
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
php artisan test               # Run all tests
php artisan test --filter=DonorTest # Run specific tests
composer test                  # Alternative test command
```

### Frontend Testing
```bash
cd frontend  
npm run lint                   # ESLint validation
npm run type-check            # TypeScript validation
# Unit tests planned for future implementation
```

## 📊 Key Business Logic

### Sponsorship Validation System
```typescript
// Real-time budget tracking prevents over-allocation
const validateSponsorship = (kafil, newAmount) => {
  const totalCommitted = kafil.sponsorships.reduce((sum, s) => sum + s.amount, 0)
  const availableAmount = kafil.monthly_pledge - totalCommitted
  
  if (newAmount > availableAmount) {
    throw new Error('المبلغ يتجاوز التعهد الشهري المتاح')
  }
}
```

### Financial Approval Workflow
```php
// Multi-step approval process ensures financial control
public function approveExpense(Expense $expense): void
{
    DB::transaction(function () use ($expense) {
        // Update expense status
        $expense->update(['status' => 'Approved', 'approved_at' => now()]);
        
        // Update bank account balance
        if ($expense->bank_account_id) {
            $expense->bankAccount->decrement('balance', $expense->amount);
        }
        
        // Log the approval
        ActivityLog::create(['action' => 'expense_approved', 'expense_id' => $expense->id]);
    });
}
```

## 🔒 Security Features

### Data Protection
- **Input Validation**: Comprehensive server-side validation with Arabic error messages
- **SQL Injection Prevention**: Laravel Eloquent ORM with parameter binding
- **XSS Protection**: React's built-in sanitization and CSP headers
- **CSRF Protection**: Laravel CSRF tokens for form submissions
- **Authentication**: Laravel Sanctum token-based API authentication

### Access Control
- **Role-based Access**: Planned implementation for multi-user environments
- **Data Isolation**: Proper data scoping and access controls
- **Audit Trails**: Complete activity logging for sensitive operations
- **Secure Sessions**: Encrypted session management

## 🌍 Localization & Accessibility

### Arabic Language Support
- **Native RTL**: Complete right-to-left layout implementation
- **Arabic Typography**: Cairo font optimized for Arabic text rendering
- **Locale Support**: Arabic date formatting and number localization  
- **Validation Messages**: All user-facing errors in Arabic
- **Cultural Considerations**: UI patterns adapted for Arabic-speaking users

### Accessibility Features
- **Screen Reader Compatible**: Semantic HTML and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast Support**: Theme support for visual accessibility
- **Mobile Responsive**: Touch-friendly interface design

## 📈 Performance & Monitoring

### Optimization Features
- **Database Indexing**: Optimized database queries and indexes
- **API Pagination**: Efficient data loading with pagination
- **Caching Strategy**: Laravel cache for reference data
- **Asset Optimization**: Minified CSS/JS and image optimization
- **Background Jobs**: Queue system for time-intensive operations

### Monitoring & Logging
- **Application Logs**: Comprehensive logging with Laravel Pail
- **Error Tracking**: Exception handling and error reporting
- **Performance Monitoring**: Query optimization and response times
- **Health Checks**: System status endpoints for monitoring

## 🚀 Deployment Guide

### Production Environment Setup

#### Server Requirements
- **Web Server**: Nginx or Apache with PHP-FPM
- **PHP**: 8.2+ with required extensions (mbstring, openssl, PDO, etc.)
- **Database**: MySQL 8.0+ or MariaDB 10.3+
- **Node.js**: 18+ for frontend build process
- **SSL Certificate**: HTTPS for production deployment

#### Environment Configuration
```bash
# Backend production settings
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database configuration
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_DATABASE=amaso_production

# Frontend configuration  
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api/v1
NODE_ENV=production
```

## 🤝 Contributing

### Development Guidelines
- **Code Standards**: Follow PSR-12 for PHP and ESLint rules for TypeScript
- **Commit Messages**: Use conventional commits with Arabic descriptions where appropriate
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update README and API documentation for changes
- **Localization**: Ensure all user-facing text supports Arabic

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/new-feature`)  
3. **Commit** changes (`git commit -m 'إضافة ميزة جديدة'`)
4. **Push** to branch (`git push origin feature/new-feature`)
5. **Open** a Pull Request with detailed description

## 📝 Changelog & Roadmap

### Current Version Features ✅
- Complete beneficiary management system
- Advanced sponsorship and donor management
- Comprehensive financial tracking and reporting
- Arabic RTL interface with full localization
- RESTful API with comprehensive endpoints
- Multi-account financial management
- Approval workflows for financial transactions

### Planned Features 🚧
- **User Authentication System**: Multi-user login with role-based access
- **Advanced Reporting**: Custom report builder with filters
- **Mobile Application**: React Native mobile app for field workers
- **Document Management**: File upload and document attachment system
- **Notification System**: Email and SMS notifications for approvals
- **Integration APIs**: Third-party system integration capabilities
- **Advanced Analytics**: Business intelligence and predictive analytics

### Future Enhancements 🔮
- **Blockchain Integration**: Transparent donation tracking
- **AI-Powered Insights**: Machine learning for donor patterns
- **Multi-Language Support**: Additional language localizations
- **Advanced Workflow Engine**: Custom approval workflows
- **Real-time Collaboration**: Multi-user real-time editing

## 📄 License & Support

### Licensing
This project is proprietary software developed specifically for Amaso Charitable Association. All rights reserved.

### Support & Maintenance
For technical support, bug reports, or feature requests:
- **Technical Issues**: Contact the development team
- **User Support**: Refer to user documentation and training materials
- **Feature Requests**: Submit detailed requirements for evaluation

### Community
Built with ❤️ for charitable work and community support.  
*نُبني بالحب من أجل العمل الخيري ومساعدة المجتمع*

---

<div align="center">

**Amaso Charitable Association Management System**  
*Empowering charitable organizations with comprehensive digital solutions*

</div>