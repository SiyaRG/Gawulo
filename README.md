# ReachHub - Trust as a Service Platform

ReachHub is a Trust as a Service (TaaS) platform designed to create verifiable and transparent local commerce. The platform empowers local vendors with technology that ensures trust and transparency in every transaction.

## Features

- **Offline-First Design**: Orders can be created and managed offline, syncing when connectivity is restored
- **Vendor Management**: Complete vendor profiles, menu management, and business analytics
- **Order Processing**: Real-time order tracking and status updates
- **Payment Integration**: Support for multiple payment methods including offline payments
- **Mobile-First**: Progressive Web App (PWA) for seamless mobile experience
- **Real-time Tracking**: Live order tracking and delivery updates

## Tech Stack

### Backend
- **Django 4.2**: Python web framework
- **Django REST Framework**: API development
- **SQLite/MySQL**: Database (SQLite for development, MySQL for production)
- **Celery**: Background task processing
- **Redis**: Caching and message broker

### Frontend
- **React 18**: JavaScript library for building user interfaces
- **TypeScript**: Type-safe JavaScript
- **Material-UI**: React component library
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and caching
- **Zustand**: State management

## Quick Start

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ReachHub
   ```

2. **Set up the backend**
   ```bash
   # Create and activate virtual environment
   python -m venv gven
   gven\Scripts\activate  # Windows
   # source gven/bin/activate  # macOS/Linux
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Navigate to Django project
   cd ReachHub
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   ```

3. **Set up the frontend**
   ```bash
   # Navigate to frontend directory
   cd ../frontend
   
   # Install dependencies
   npm install
   ```

### Running the Application

#### Option 1: Using the provided scripts

**Windows:**
```bash
# Using batch file
start-dev.bat

# Or using PowerShell
.\start-dev.ps1
```

**macOS/Linux:**
```bash
# Create and run the script
chmod +x start-dev.sh
./start-dev.sh
```

#### Option 2: Manual startup

1. **Start Django backend**
   ```bash
   cd ReachHub
   gven\Scripts\activate  # Windows
   python manage.py runserver
   ```

2. **Start React frontend** (in a new terminal)
   ```bash
   cd frontend
   npm start
   ```

### Accessing the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/

## Project Structure

```
gawulo/
├── Gawulo/                 # Django project
│   ├── Gawulo/            # Django settings and configuration
│   ├── vendors/           # Vendor management app
│   ├── orders/            # Order processing app
│   ├── payments/          # Payment processing app
│   ├── sync/              # Data synchronization app
│   ├── tracking/          # Order tracking app
│   └── manage.py          # Django management script
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
├── docker/                # Docker configuration
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## API Endpoints

### Vendors
- `GET /api/vendors/` - List all vendors
- `GET /api/vendors/{id}/` - Get vendor details
- `POST /api/vendors/register/` - Register new vendor
- `GET /api/vendors/{id}/menu/` - Get vendor menu
- `GET /api/vendors/{id}/reviews/` - Get vendor reviews

### Orders
- `GET /api/orders/` - List all orders (admin only)
- `GET /api/orders/{id}/` - Get order details
- `POST /api/orders/create/` - Create new order
- `PATCH /api/orders/{id}/status/` - Update order status
- `GET /api/orders/my-orders/` - Get user's orders
- `GET /api/orders/vendor-orders/` - Get vendor's orders

### Menu Items
- `GET /api/vendors/menu-items/` - List all menu items
- `GET /api/vendors/menu-items/{id}/` - Get menu item details

## Development

### Backend Development

1. **Running tests**
   ```bash
   cd ReachHub
   python manage.py test
   ```

2. **Creating migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Shell access**
   ```bash
   python manage.py shell
   ```

### Frontend Development

1. **Running tests**
   ```bash
   cd frontend
   npm test
   ```

2. **Type checking**
   ```bash
   npm run type-check
   ```

3. **Building for production**
   ```bash
   npm run build
   ```

## Offline-First Features

### Service Worker
- Caches static assets for offline access
- Handles background sync for offline operations
- Manages push notifications

### IndexedDB Storage
- Local storage for orders, payments, and user data
- Offline data persistence
- Conflict resolution when syncing

### Sync Queue
- Queues offline operations for later sync
- Handles network connectivity changes
- Provides conflict resolution strategies

## Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f
```

### Manual Deployment
See `SETUP.md` for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For additional support:
- Check the `/docs` directory for detailed documentation
- Create an issue on GitHub for bugs or feature requests
- Use GitHub Discussions for questions and community support

## Acknowledgments

- Built for South African township communities
- Designed with offline-first principles
- Empowering local food vendors with technology
