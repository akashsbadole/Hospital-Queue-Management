# Hospital Queue Management System

A comprehensive, modern hospital queue management system built with Next.js 15, TypeScript, and Prisma. This system streamlines patient flow, manages queues across multiple departments, and provides real-time updates for both staff and patients.

## 🌟 Features

### 🏥 Core Functionality

#### **Patient Management**
- **Patient Registration**: Complete registration with demographic, medical, and socio-economic details
- **Enhanced Profiles**: Support for BPL/Yellow cards, Aadhaar numbers, caste/religion data
- **Health Records**: Comprehensive medical history, diagnoses, treatments, and prescriptions
- **Document Management**: Digital storage of patient documents and medical history

#### **Queue Management**
- **Multi-Department Support**: OPD, Pharmacy, and specialized department queues
- **Real-time Updates**: Live queue status with Socket.IO integration
- **Priority System**: NORMAL, URGENT, EMERGENCY priority levels
- **Token Generation**: Automatic token numbering and management
- **Queue Display**: Public display screen for patients showing current status

#### **Staff Management**
- **Role-Based Access**: SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF roles
- **Department Assignment**: Staff assigned to specific departments
- **Authentication**: Secure login system with role-based permissions
- **Activity Tracking**: Monitor staff actions and system usage

#### **Billing & Receipts**
- **Receipt Generation**: Professional receipt creation for services
- **Multiple Payment Methods**: Cash, Card, UPI, Insurance support
- **Tax Compliance**: Proper receipt numbering and financial tracking
- **Receipt Management**: View, edit, and organize receipts by patient and date

#### **Pharmacy Management**
- **Medicine Inventory**: Complete stock management with expiry tracking
- **Prescription Processing**: Digital prescription fulfillment
- **Queue Integration**: Pharmacy queue management for medicine collection
- **Billing Integration**: Seamless billing for pharmacy services

### 🚀 Advanced Features

#### **Real-time Communication**
- **Socket.IO Integration**: Real-time updates across all connected devices
- **Live Queue Display**: Public screens showing current queue status
- **Notifications**: Automatic alerts for queue changes and updates
- **Sound Alerts**: Audio notifications for important events

#### **Analytics & Reporting**
- **Queue Analytics**: Wait times, service times, and throughput metrics
- **Department Performance**: Statistics for each department's efficiency
- **Patient Flow Analysis**: Track patient movement through the system
- **Revenue Tracking**: Financial reports and billing analytics

#### **User Experience**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Interface**: Clean, modern UI built with shadcn/ui components
- **Accessibility**: WCAG compliant design with screen reader support
- **Multi-language Ready**: Structured for internationalization

#### **System Administration**
- **User Management**: Create, edit, and manage system users
- **Department Management**: Configure departments and services
- **System Settings**: Configure system-wide parameters and settings
- **Audit Logs**: Track all system activities and changes

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Lucide React**: Beautiful icon library
- **Framer Motion**: Smooth animations and transitions
- **Socket.IO Client**: Real-time communication

### **Backend**
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Database ORM with type safety
- **SQLite**: Lightweight database for development
- **Socket.IO**: Real-time bidirectional communication
- **Zod**: Schema validation

### **Authentication & Security**
- **NextAuth.js**: Authentication framework
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Granular permission system
- **Input Validation**: Protection against SQL injection and XSS
- **Rate Limiting**: API protection against abuse

### **Development Tools**
- **ESLint**: Code linting and quality
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality
- **tsx**: TypeScript execution
- **Nodemon**: Development server with auto-reload

## 📦 Installation

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- SQLite (included with Prisma)

### **Clone & Install**
```bash
# Clone the repository
git clone <repository-url>
cd hospital-queue-management

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### **Environment Configuration**
Create `.env` file with:
```env
# Database
DATABASE_URL="file:./dev.db"

# Application
NODE_ENV="development"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Socket.IO (for production)
SOCKET_IO_URL="http://localhost:3000"
```

### **Database Setup**
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### **Start Development Server**
```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## 🚀 Deployment

### **Production Build**
```bash
# Build the application
npm run build

# Start production server
npm start
```

### **Docker Deployment**

#### **Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### **Docker Compose**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  # Optional: PostgreSQL for production
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hospital_queue
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### **Vercel Deployment**
1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all required environment variables
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`
5. **Database**: Use managed database service or configure external database

### **Railway Deployment**
1. **Install Railway CLI**: `npm install -g @railway/cli`
2. **Login**: `railway login`
3. **Initialize**: `railway init`
4. **Deploy**: `railway up`
5. **Add Environment Variables** through Railway dashboard

### **Traditional Server Deployment**

#### **System Requirements**
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- Nginx (optional, for reverse proxy)
- PM2 (process manager)

#### **Deployment Steps**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <repository-url>
cd hospital-queue-management

# Install dependencies
npm install

# Build application
npm run build

# Configure environment
cp .env.example .env
# Edit .env with production values

# Setup database
npm run db:generate
npm run db:push
npm run db:seed

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

#### **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Database Schema

### **Core Tables**
- **Users**: Authentication and role management
- **Patients**: Patient demographics and medical information
- **Departments**: Hospital departments and services
- **OPDQueues**: Outpatient department queue management
- **PharmacyQueues**: Pharmacy queue management
- **HealthRecords**: Patient medical history
- **Prescriptions**: Medical prescriptions
- **Medicines**: Pharmacy inventory
- **Receipts**: Billing and payment records

### **Relationships**
- Users → Departments (many-to-one)
- Patients → OPDQueues (one-to-many)
- Patients → HealthRecords (one-to-many)
- Patients → Prescriptions (one-to-many)
- Patients → Receipts (one-to-many)
- Departments → OPDQueues (one-to-many)
- Departments → PharmacyQueues (one-to-many)

## 🔧 Configuration

### **Environment Variables**
```env
# Application
NODE_ENV=development
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=file:./dev.db

# External Services (optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
EMAIL_SERVICE_API_KEY=your-email-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### **Customization**
- **Theme**: Modify Tailwind CSS configuration in `tailwind.config.js`
- **Departments**: Add/remove departments in database or seed script
- **User Roles**: Extend roles in authentication system
- **Queue Logic**: Customize priority algorithms in API endpoints

## 🧪 Testing

### **Unit Tests**
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage
```

### **Integration Tests**
```bash
# Run integration tests
npm run test:integration

# Test API endpoints
npm run test:api
```

### **E2E Tests**
```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npm run test:e2e
```

## 📈 Monitoring & Logging

### **Application Monitoring**
- **Health Checks**: `/api/health` endpoint
- **Performance**: Response time tracking
- **Error Tracking**: Integrated error reporting
- **User Analytics**: Usage statistics and patterns

### **Logging**
```javascript
// Application logging
console.log('Info message');
console.warn('Warning message');
console.error('Error message');

// Database queries (Prisma)
prisma.$on('query', (e) => {
  console.log(e.query);
});
```

## 🔒 Security

### **Authentication**
- JWT-based authentication
- Role-based access control
- Session management
- Password hashing

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### **API Security**
- Rate limiting
- Request validation
- CORS configuration
- HTTPS enforcement

## 🤝 Contributing

### **Development Workflow**
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/new-feature`
3. **Make** changes and test thoroughly
4. **Commit** changes: `git commit -m 'Add new feature'`
5. **Push** to branch: `git push origin feature/new-feature`
6. **Create** Pull Request

### **Code Standards**
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Include tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Documentation**
- [API Documentation](/docs/api.md)
- [User Guide](/docs/user-guide.md)
- [Deployment Guide](/docs/deployment.md)
- [Troubleshooting](/docs/troubleshooting.md)

### **Getting Help**
- **Issues**: Create an issue on GitHub
- **Discussions**: Join community discussions
- **Email**: support@hospital-queue.com
- **Documentation**: Check docs folder

### **Bug Reports**
When reporting bugs, please include:
- Environment details
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Error messages and logs

## 🎯 Roadmap

### **Phase 1** (Current)
- ✅ Core queue management
- ✅ Patient registration
- ✅ Staff management
- ✅ Basic receipt generation

### **Phase 2** (Upcoming)
- 🔄 Mobile app development
- 🔄 SMS notifications
- 🔄 Advanced analytics
- 🔄 Integration with medical devices

### **Phase 3** (Future)
- 📋 AI-powered queue optimization
- 📋 Telemedicine integration
- 📋 Multi-hospital support
- 📋 Advanced reporting

## 🙏 Acknowledgments

- **Next.js Team**: For the excellent framework
- **Prisma Team**: For the amazing ORM
- **shadcn/ui**: For the beautiful components
- **Tailwind CSS**: For the utility-first CSS framework
- **Socket.IO**: For real-time communication
- **Contributors**: All developers who contributed to this project

---

**Built with ❤️ for better healthcare management**