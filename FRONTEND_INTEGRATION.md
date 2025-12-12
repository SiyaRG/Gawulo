# Frontend Integration with Django Backend

This document provides comprehensive information about the React frontend integration with the Django backend for the ReachHub Trust as a Service platform.

## 🚀 Overview

The frontend is built with React, TypeScript, and Material-UI, providing a modern, responsive interface that integrates seamlessly with the Django REST API backend. The integration includes:

- **Authentication & Authorization**
- **Real-time CRUD Operations**
- **Offline-first Capabilities**
- **Responsive Design**
- **Type Safety**

## 🏗️ Architecture

### Frontend Stack
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Material-UI (MUI)** - Component Library
- **React Query** - Data Fetching & Caching
- **React Router** - Navigation
- **React Hot Toast** - Notifications

### Integration Points
- **API Service Layer** - Centralized API communication
- **React Query Hooks** - Data management
- **Authentication Context** - User session management
- **Offline Storage** - Local data persistence

## 📁 Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── LoginForm.tsx   # Authentication form
│   └── ...
├── hooks/              # Custom React hooks
│   └── useApi.ts       # API integration hooks
├── pages/              # Page components
│   ├── VendorDashboard.tsx    # Vendor CRUD interface
│   ├── CustomerDashboard.tsx  # Customer interface
│   └── ...
├── services/           # Service layer
│   ├── api.ts         # API service
│   ├── storage.ts     # Offline storage
│   └── sync.ts        # Data synchronization
├── types/              # TypeScript definitions
│   └── index.ts       # Core types
└── utils/              # Utility functions
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Django backend running on port 9033

### Installation
```bash
cd frontend
npm install
```

### Environment Configuration
Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:9033/api
REACT_APP_ENVIRONMENT=development
```

### Start Development Server
```bash
npm start
```

The frontend will run on `http://localhost:3001`

## 🔐 Authentication Integration

### Login Flow
1. User enters credentials in `LoginForm`
2. Credentials sent to Django `/api/auth/login/`
3. Session token stored in localStorage
4. User redirected to appropriate dashboard

### Protected Routes
All dashboard routes require authentication:
- `/vendor` - Vendor dashboard
- `/customer` - Customer dashboard
- `/profile` - User profile
- `/settings` - App settings

### Sample Credentials
```javascript
// Admin User
username: 'admin'
password: 'admin123'

// Customer
username: 'customer1'
password: 'password123'

// Vendor
username: 'street_food_vendor'
password: 'vendor123'
```

## 📊 CRUD Operations

### Vendors

#### Browse Vendors
```typescript
const { data: vendors, isLoading } = useVendors({
  search: 'curry',
  business_type: 'street_food'
});
```

#### Vendor Details
```typescript
const { data: vendor } = useVendor(vendorId);
```

#### Search Vendors
```typescript
const { data: searchResults } = useSearchVendors({
  min_rating: 4,
  max_delivery_radius: 5,
  search: 'traditional'
});
```

### Menu Items

#### List Menu Items
```typescript
const { data: menuItems } = useMenuItems({
  vendor: vendorId,
  category: categoryId
});
```

#### Create Menu Item (Vendor Only)
```typescript
const createMenuItem = useCreateMenuItem();
createMenuItem.mutate({
  name: 'New Dish',
  description: 'Delicious new dish',
  price: 45.00,
  preparation_time: 20,
  category: categoryId,
  is_featured: false
});
```

#### Update Menu Item
```typescript
const updateMenuItem = useUpdateMenuItem();
updateMenuItem.mutate({
  id: menuItemId,
  data: { price: 50.00, description: 'Updated description' }
});
```

#### Delete Menu Item
```typescript
const deleteMenuItem = useDeleteMenuItem();
deleteMenuItem.mutate(menuItemId);
```

### Orders

#### Create Order
```typescript
const createOrder = useCreateOrder();
createOrder.mutate({
  vendor_id: vendorId,
  delivery_type: 'delivery',
  delivery_address: '123 Main Street',
  items: [
    {
      menu_item_id: menuItemId,
      quantity: 2,
      special_instructions: 'Extra spicy'
    }
  ]
});
```

#### Update Order Status
```typescript
const updateOrderStatus = useUpdateOrderStatus();
updateOrderStatus.mutate({
  id: orderId,
  status: 'confirmed'
});
```

#### View My Orders
```typescript
const { data: myOrders } = useMyOrders();
```

### Reviews

#### Create Review
```typescript
const createReview = useCreateReview();
createReview.mutate({
  vendorId: vendorId,
  reviewData: {
    rating: 5,
    comment: 'Amazing food and service!'
  }
});
```

## 🎨 UI Components

### Vendor Dashboard
- **Stats Cards** - Key metrics display
- **Menu Management** - CRUD operations for menu items
- **Order Management** - View and update order status
- **Real-time Updates** - Live data synchronization

### Customer Dashboard
- **Vendor Browsing** - Search and filter vendors
- **Shopping Cart** - Add/remove items, quantity management
- **Order History** - View past orders and status
- **Review System** - Rate and review vendors

### Common Features
- **Responsive Design** - Works on all screen sizes
- **Loading States** - Smooth user experience
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Success/error feedback

## 🔄 Data Flow

### API Integration Flow
1. **React Query Hooks** - Manage data fetching
2. **API Service** - Handle HTTP requests
3. **Django Backend** - Process requests and return data
4. **Frontend State** - Update UI with new data

### Offline Support
1. **Local Storage** - Cache data for offline access
2. **Sync Queue** - Queue operations when offline
3. **Background Sync** - Sync when connection restored

## 🧪 Testing the Integration

### 1. Start Both Servers
```bash
# Terminal 1 - Django Backend
cd ReachHub
..\gven\Scripts\activate
python manage.py runserver 9033

# Terminal 2 - React Frontend
cd frontend
npm start
```

### 2. Test Authentication
1. Visit `http://localhost:3001/login`
2. Use sample credentials to login
3. Verify redirect to appropriate dashboard

### 3. Test CRUD Operations

#### Vendor Operations
1. Login as vendor (`street_food_vendor` / `vendor123`)
2. Navigate to `/vendor`
3. Test creating, updating, deleting menu items
4. Test order status updates

#### Customer Operations
1. Login as customer (`customer1` / `password123`)
2. Navigate to `/customer`
3. Browse vendors and add items to cart
4. Place orders and leave reviews

### 4. Test API Endpoints
Visit `http://localhost:9033/api/` to see all available endpoints

## 🐛 Troubleshooting

### Common Issues

#### CORS Errors
- Ensure Django CORS settings are configured
- Check that frontend URL is in `CORS_ALLOWED_ORIGINS`

#### Authentication Issues
- Verify Django session authentication is working
- Check localStorage for auth token
- Ensure API endpoints are properly protected

#### Data Not Loading
- Check browser network tab for failed requests
- Verify API endpoints are responding
- Check React Query cache and refetch data

### Debug Tools
- **React Developer Tools** - Component inspection
- **Redux DevTools** - State management (if using Redux)
- **Network Tab** - API request monitoring
- **Console Logs** - Error tracking

## 📱 Responsive Design

The frontend is fully responsive and works on:
- **Desktop** - Full dashboard experience
- **Tablet** - Optimized layout
- **Mobile** - Touch-friendly interface

### Breakpoints
- **xs**: 0px - 600px (Mobile)
- **sm**: 600px - 960px (Tablet)
- **md**: 960px - 1280px (Small Desktop)
- **lg**: 1280px+ (Large Desktop)

## 🚀 Performance Optimization

### React Query Features
- **Automatic Caching** - Reduces API calls
- **Background Updates** - Fresh data without user interaction
- **Optimistic Updates** - Immediate UI feedback
- **Error Retry** - Automatic retry on failures

### Code Splitting
- **Route-based splitting** - Load pages on demand
- **Component lazy loading** - Reduce initial bundle size

## 🔒 Security Considerations

### Authentication
- **Session-based auth** - Secure token management
- **Route protection** - Prevent unauthorized access
- **Token refresh** - Automatic session renewal

### Data Validation
- **Frontend validation** - Immediate user feedback
- **Backend validation** - Server-side security
- **Type safety** - TypeScript prevents runtime errors

## 📈 Future Enhancements

### Planned Features
- **Real-time notifications** - WebSocket integration
- **Push notifications** - Service worker implementation
- **Advanced search** - Elasticsearch integration
- **Payment integration** - Stripe/PayPal support
- **Analytics dashboard** - Business insights

### Performance Improvements
- **Virtual scrolling** - Handle large datasets
- **Image optimization** - Lazy loading and compression
- **Service worker** - Offline-first capabilities
- **PWA features** - App-like experience

## 📚 Additional Resources

### Documentation
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Query](https://tanstack.com/query/latest)
- [Material-UI](https://mui.com/)
- [TypeScript](https://www.typescriptlang.org/)

### API Reference
- See `API_DOCUMENTATION.md` for complete API reference
- Interactive API docs at `http://localhost:9033/api/`

### Development Tools
- **VS Code Extensions** - ESLint, Prettier, TypeScript
- **Chrome Extensions** - React Developer Tools
- **Postman** - API testing

---

This integration provides a complete, production-ready frontend for the ReachHub Trust as a Service platform with full CRUD capabilities, authentication, and offline support.
