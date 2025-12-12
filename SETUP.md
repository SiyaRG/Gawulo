# ReachHub Project Setup Guide

This guide will help you set up the ReachHub Trust as a Service platform for development and production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [Development Environment](#development-environment)
7. [Production Deployment](#production-deployment)
8. [Offline-First Features](#offline-first-features)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher
- **MySQL**: 8.0 or higher
- **Redis**: 7.0 or higher (optional for development)
- **Git**: Latest version

### Development Tools
- **Code Editor**: VS Code, PyCharm, or similar
- **Database Client**: MySQL Workbench, DBeaver, or similar
- **API Testing**: Postman, Insomnia, or similar

## Project Structure

```
reachhub/
├── backend/                 # Django backend
│   ├── reachhub/             # Main Django project
│   ├── apps/               # Django applications
│   │   ├── vendors/        # Vendor management
│   │   ├── orders/         # Order processing
│   │   ├── payments/       # Payment processing
│   │   ├── sync/           # Data synchronization
│   │   └── tracking/       # Real-time tracking
│   ├── core/               # Core utilities
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json        # Node dependencies
├── docs/                   # Documentation
├── docker/                 # Docker configuration
└── README.md              # Project overview
```

## Backend Setup

### 1. Python Environment Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Configuration

Create a MySQL database for the project:

```sql
CREATE DATABASE reachhub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'reachhub_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON reachhub_db.* TO 'reachhub_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Environment Variables

Create a `.env` file in the backend directory:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=mysql://reachhub_user:your_password@localhost:3306/reachhub_db

# Redis (optional for development)
REDIS_URL=redis://localhost:6379/0

# Email (optional for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Payment Gateway (configure as needed)
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_TEST_MODE=True

# File Storage
MEDIA_URL=/media/
STATIC_URL=/static/
MEDIA_ROOT=media/
STATIC_ROOT=staticfiles/
```

### 4. Django Setup

```bash
# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic

# Run development server
python manage.py runserver
```

### 5. Celery Setup (Optional for Development)

```bash
# Install Redis (if not already installed)
# Windows: Download from https://redis.io/download
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server

# Start Redis
redis-server

# Start Celery worker (in new terminal)
celery -A gawulo worker --loglevel=info

# Start Celery beat (in new terminal)
celery -A gawulo beat --loglevel=info
```

## Frontend Setup

### 1. Node.js Environment Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 2. Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_OFFLINE=true
REACT_APP_ENABLE_PUSH_NOTIFICATIONS=true
REACT_APP_ENABLE_LOCATION_SERVICES=true

# Analytics (optional)
REACT_APP_GOOGLE_ANALYTICS_ID=your_ga_id
```

### 3. PWA Configuration

The frontend includes Progressive Web App (PWA) features:

- **Service Worker**: Handles offline functionality and caching
- **Manifest**: App installation and appearance
- **Offline Storage**: IndexedDB for local data storage

## Database Setup

### 1. Initial Data

Create initial data for the application:

```bash
# Create sample vendors
python manage.py shell
```

```python
from vendors.models import Vendor, MenuCategory, MenuItem
from django.contrib.auth.models import User

# Create sample vendor
user = User.objects.create_user(
    username='sample_vendor',
    email='vendor@example.com',
    password='password123'
)

vendor = Vendor.objects.create(
    user=user,
    business_name='Sample Food Vendor',
    business_type='street_food',
    phone_number='+27123456789',
    address='123 Main Street, Township',
    status='active',
    is_verified=True
)

# Create menu categories
category = MenuCategory.objects.create(
    vendor=vendor,
    name='Main Dishes',
    description='Traditional township dishes'
)

# Create menu items
MenuItem.objects.create(
    vendor=vendor,
    category=category,
    name='Pap and Wors',
    description='Traditional South African pap with boerewors',
    price=45.00,
    preparation_time=20
)
```

### 2. Database Migrations

```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Check migration status
python manage.py showmigrations
```

## Development Environment

### 1. Development Workflow

1. **Backend Development**:
   ```bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python manage.py runserver
   ```

2. **Frontend Development**:
   ```bash
   cd frontend
   npm start
   ```

3. **Database Management**:
   ```bash
   python manage.py dbshell
   ```

### 2. Code Quality Tools

Install development dependencies:

```bash
# Backend
pip install black flake8 isort mypy

# Frontend
npm install --save-dev eslint prettier @typescript-eslint/eslint-plugin
```

### 3. Testing

```bash
# Backend tests
python manage.py test

# Frontend tests
npm test

# Run all tests
npm run test:coverage
```

## Production Deployment

### 1. Docker Deployment

```bash
# Build and start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### 2. Manual Deployment

#### Backend Deployment

1. **Server Setup**:
   ```bash
   # Install system dependencies
   sudo apt-get update
   sudo apt-get install python3.11 python3.11-venv mysql-server redis-server nginx
   ```

2. **Application Setup**:
   ```bash
   # Clone repository
   git clone https://github.com/your-repo/reachhub.git
   cd reachhub/backend

   # Setup virtual environment
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Configure environment
   cp .env.example .env
   # Edit .env with production values

   # Setup database
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

3. **Gunicorn Setup**:
   ```bash
   # Install gunicorn
   pip install gunicorn

   # Create systemd service
   sudo nano /etc/systemd/system/reachhub.service
   ```

   ```ini
   [Unit]
   Description=ReachHub Django Application
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/path/to/reachhub/backend
   Environment="PATH=/path/to/reachhub/backend/venv/bin"
   ExecStart=/path/to/reachhub/backend/venv/bin/gunicorn --workers 4 --bind unix:/run/reachhub.sock Gawulo.wsgi:application

   [Install]
   WantedBy=multi-user.target
   ```

#### Frontend Deployment

1. **Build Production Version**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve with Nginx**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           root /path/to/reachhub/frontend/build;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://unix:/run/reachhub.sock;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /static/ {
           alias /path/to/reachhub/backend/staticfiles/;
       }

       location /media/ {
           alias /path/to/reachhub/backend/media/;
       }
   }
   ```

## Offline-First Features

### 1. Service Worker

The service worker provides:
- **Offline caching** of static assets
- **Background sync** for offline operations
- **Push notifications** for order updates

### 2. IndexedDB Storage

Local data storage for:
- **Orders**: Created offline, synced when online
- **Payments**: Offline payment tracking
- **Menu items**: Cached for offline browsing
- **User data**: Profile and preferences

### 3. Sync Queue

Offline operations are queued and processed when connectivity is restored:
- **Order creation**: Stored locally, synced to server
- **Payment recording**: Tracked offline, reconciled online
- **Data updates**: Queued for server synchronization

### 4. Conflict Resolution

When conflicts occur between local and server data:
- **Server wins**: Default strategy for most data
- **Client wins**: For user-specific preferences
- **Manual resolution**: For critical conflicts

## Testing

### 1. Unit Tests

```bash
# Backend tests
python manage.py test vendors.tests
python manage.py test orders.tests
python manage.py test payments.tests
python manage.py test sync.tests

# Frontend tests
npm test -- --coverage
```

### 2. Integration Tests

```bash
# API tests
python manage.py test api.tests

# End-to-end tests
npm run test:e2e
```

### 3. Offline Testing

1. **Disconnect from internet**
2. **Create orders offline**
3. **Reconnect and verify sync**
4. **Check conflict resolution**

## Troubleshooting

### Common Issues

1. **Database Connection**:
   ```bash
   # Check MySQL status
   sudo systemctl status mysql

   # Test connection
   mysql -u reachhub_user -p reachhub_db
   ```

2. **Redis Connection**:
   ```bash
   # Check Redis status
   sudo systemctl status redis

   # Test connection
   redis-cli ping
   ```

3. **Frontend Build Issues**:
   ```bash
   # Clear cache
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Django Migration Issues**:
   ```bash
   # Reset migrations
   python manage.py migrate --fake-initial
   python manage.py migrate
   ```

### Performance Optimization

1. **Database Optimization**:
   - Add indexes for frequently queried fields
   - Use database connection pooling
   - Implement query optimization

2. **Frontend Optimization**:
   - Enable code splitting
   - Implement lazy loading
   - Optimize bundle size

3. **Caching Strategy**:
   - Redis for session storage
   - CDN for static assets
   - Browser caching for API responses

### Security Considerations

1. **Environment Variables**:
   - Never commit sensitive data to version control
   - Use strong, unique passwords
   - Rotate secrets regularly

2. **Database Security**:
   - Use strong passwords
   - Limit database access
   - Enable SSL connections

3. **API Security**:
   - Implement rate limiting
   - Use HTTPS in production
   - Validate all inputs

## Support

For additional support:
- **Documentation**: Check the `/docs` directory
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
