# Gawulo API Documentation

This document provides comprehensive information about all available API endpoints in the Gawulo system.

## Base URL
```
http://localhost:9033/api/
```

## Authentication
Most endpoints require authentication. Use session authentication or include authentication headers.

## API Endpoints

### 🔥 Vendors

#### List All Vendors
```http
GET /api/vendors/
```
**Description:** Get all active and verified vendors
**Permissions:** Public
**Query Parameters:**
- `business_type`: Filter by business type
- `delivery_radius`: Filter by delivery radius
- `search`: Search in business name and description
- `ordering`: Sort by rating, total_orders, created_at

**Example Response:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "business_name": "Mama Zulu's Street Food",
      "business_type": "street_food",
      "description": "Authentic township street food...",
      "rating": "4.5",
      "total_orders": 150,
      "delivery_fee": "15.00",
      "minimum_order": "20.00"
    }
  ]
}
```

#### Get Vendor Details
```http
GET /api/vendors/{id}/
```
**Description:** Get detailed information about a specific vendor
**Permissions:** Public

#### Register New Vendor
```http
POST /api/vendors/register/
```
**Description:** Register a new vendor account
**Permissions:** Authenticated users
**Request Body:**
```json
{
  "business_name": "New Vendor",
  "business_type": "street_food",
  "description": "Vendor description",
  "phone_number": "+27123456789",
  "email": "vendor@example.com",
  "address": "123 Main Street",
  "password": "password123",
  "confirm_password": "password123"
}
```

#### Update Vendor
```http
PATCH /api/vendors/{id}/update/
```
**Description:** Update vendor information
**Permissions:** Vendor owner only

#### Get Vendor Statistics
```http
GET /api/vendors/{id}/stats/
```
**Description:** Get vendor statistics
**Permissions:** Vendor owner or admin

#### Search Vendors
```http
GET /api/vendors/search/
```
**Description:** Search vendors with filters
**Permissions:** Public
**Query Parameters:**
- `business_type`: Filter by business type
- `min_rating`: Minimum rating filter
- `max_delivery_radius`: Maximum delivery radius
- `search`: Search in name and description

### 🍽️ Menu Items

#### List All Menu Items
```http
GET /api/vendors/menu-items/
```
**Description:** Get all available menu items
**Permissions:** Public
**Query Parameters:**
- `vendor`: Filter by vendor ID
- `category`: Filter by category
- `price`: Filter by price range
- `search`: Search in name and description

#### Get Menu Item Details
```http
GET /api/vendors/menu-items/{id}/
```
**Description:** Get detailed information about a menu item
**Permissions:** Public

#### Create Menu Item
```http
POST /api/vendors/menu-items/create/
```
**Description:** Create a new menu item
**Permissions:** Vendors only
**Request Body:**
```json
{
  "category": "category_id",
  "name": "New Dish",
  "description": "Delicious new dish",
  "price": "45.00",
  "preparation_time": 20,
  "is_featured": false
}
```

#### Update Menu Item
```http
PATCH /api/vendors/menu-items/{id}/update/
```
**Description:** Update a menu item
**Permissions:** Menu item owner (vendor) only

#### Delete Menu Item
```http
DELETE /api/vendors/menu-items/{id}/delete/
```
**Description:** Delete a menu item
**Permissions:** Menu item owner (vendor) only

### 📋 Menu Categories

#### List Categories
```http
GET /api/vendors/categories/
```
**Description:** Get all active menu categories
**Permissions:** Public

#### Create Category
```http
POST /api/vendors/categories/create/
```
**Description:** Create a new menu category
**Permissions:** Vendors only
**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "sort_order": 1
}
```

### 📦 Orders

#### List All Orders (Admin)
```http
GET /api/orders/
```
**Description:** Get all orders (admin only)
**Permissions:** Admin only

#### Get Order Details
```http
GET /api/orders/{id}/
```
**Description:** Get detailed information about an order
**Permissions:** Order owner (customer/vendor) or admin

#### Create Order
```http
POST /api/orders/create/
```
**Description:** Create a new order
**Permissions:** Authenticated customers
**Request Body:**
```json
{
  "vendor_id": "vendor_uuid",
  "delivery_type": "delivery",
  "delivery_address": "123 Main Street",
  "delivery_instructions": "Call when arriving",
  "items": [
    {
      "menu_item_id": "menu_item_uuid",
      "quantity": 2,
      "special_instructions": "Extra spicy"
    }
  ]
}
```

#### Update Order
```http
PATCH /api/orders/{id}/update/
```
**Description:** Update order details
**Permissions:** Order owner or admin

#### Delete Order
```http
DELETE /api/orders/{id}/delete/
```
**Description:** Delete an order (only if pending)
**Permissions:** Order owner or admin

#### Update Order Status
```http
PATCH /api/orders/{id}/status/
```
**Description:** Update order status
**Permissions:** Order owner or admin
**Request Body:**
```json
{
  "status": "confirmed"
}
```

#### Get My Orders
```http
GET /api/orders/my-orders/
```
**Description:** Get orders for the current customer
**Permissions:** Authenticated customers

#### Get Vendor Orders
```http
GET /api/orders/vendor-orders/
```
**Description:** Get orders for the current vendor
**Permissions:** Authenticated vendors

#### Get Order Statistics
```http
GET /api/orders/stats/
```
**Description:** Get order statistics for the authenticated user
**Permissions:** Authenticated users

#### Search Orders
```http
GET /api/orders/search/
```
**Description:** Search orders with filters
**Permissions:** Authenticated users
**Query Parameters:**
- `status`: Filter by order status
- `delivery_type`: Filter by delivery type
- `start_date`: Filter by start date
- `end_date`: Filter by end date
- `order_number`: Search by order number

### ⭐ Reviews

#### Get Vendor Reviews
```http
GET /api/vendors/{id}/reviews/
```
**Description:** Get reviews for a specific vendor
**Permissions:** Public

#### Create Review
```http
POST /api/vendors/{id}/reviews/
```
**Description:** Create a review for a vendor
**Permissions:** Authenticated customers
**Request Body:**
```json
{
  "rating": 5,
  "comment": "Amazing food and service!"
}
```

## 🔐 Authentication Endpoints

### Login
```http
POST /api/auth/login/
```
**Description:** Login with username and password
**Request Body:**
```json
{
  "username": "customer1",
  "password": "password123"
}
```

### Logout
```http
POST /api/auth/logout/
```
**Description:** Logout current user
**Permissions:** Authenticated users

## 📊 Sample Data

The system comes with pre-loaded sample data:

### Users
- **Admin:** `admin` / `admin123`
- **Customer 1:** `customer1` / `password123`
- **Customer 2:** `customer2` / `password123`
- **Vendor 1:** `street_food_vendor` / `vendor123`
- **Vendor 2:** `home_kitchen_vendor` / `vendor123`

### Sample Vendors
1. **Mama Zulu's Street Food** - Street food vendor with traditional dishes
2. **Auntie Ndlovu's Home Kitchen** - Home kitchen with traditional meals

### Sample Menu Items
- Pap and Wors
- Chicken Curry
- Umngqusho
- Malva Pudding
- And more...

## 🧪 Testing the API

### Using curl

#### Get all vendors
```bash
curl -X GET http://localhost:9033/api/vendors/
```

#### Get vendor details
```bash
curl -X GET http://localhost:9033/api/vendors/{vendor_id}/
```

#### Create a review (requires authentication)
```bash
curl -X POST http://localhost:9033/api/vendors/{vendor_id}/reviews/ \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Great food!"}'
```

### Using Postman

1. Import the collection
2. Set the base URL to `http://localhost:9033/api/`
3. Use the authentication endpoints to get a session
4. Test the CRUD operations

## 🔄 CRUD Operations Summary

### Vendors
- ✅ **Create:** `POST /api/vendors/register/`
- ✅ **Read:** `GET /api/vendors/` and `GET /api/vendors/{id}/`
- ✅ **Update:** `PATCH /api/vendors/{id}/update/`
- ❌ **Delete:** Not implemented (vendors cannot be deleted)

### Menu Items
- ✅ **Create:** `POST /api/vendors/menu-items/create/`
- ✅ **Read:** `GET /api/vendors/menu-items/` and `GET /api/vendors/menu-items/{id}/`
- ✅ **Update:** `PATCH /api/vendors/menu-items/{id}/update/`
- ✅ **Delete:** `DELETE /api/vendors/menu-items/{id}/delete/`

### Orders
- ✅ **Create:** `POST /api/orders/create/`
- ✅ **Read:** `GET /api/orders/` and `GET /api/orders/{id}/`
- ✅ **Update:** `PATCH /api/orders/{id}/update/`
- ✅ **Delete:** `DELETE /api/orders/{id}/delete/` (pending orders only)

### Reviews
- ✅ **Create:** `POST /api/vendors/{id}/reviews/`
- ✅ **Read:** `GET /api/vendors/{id}/reviews/`
- ❌ **Update:** Not implemented
- ❌ **Delete:** Not implemented

## 🚀 Getting Started

1. **Start the servers:**
   ```bash
   # Windows
   .\start-dev.bat
   
   # Or manually
   cd Gawulo && ..\gven\Scripts\activate && python manage.py runserver 9033
   cd frontend && npm start
   ```

2. **Seed the database:**
   ```bash
   cd Gawulo
   python seed_data.py
   ```

3. **Test the API:**
   - Visit http://localhost:9033/api/ for the API root
   - Visit http://localhost:9033/admin/ for the admin interface
   - Use the sample credentials to test different user roles

4. **Explore the endpoints:**
   - Start with public endpoints like `/api/vendors/`
   - Login to test authenticated endpoints
   - Try creating, updating, and deleting data

## 📝 Notes

- All UUIDs are used for primary keys
- Decimal fields are used for monetary values
- Timestamps are in ISO format
- The system supports offline-first operations
- CORS is configured for frontend integration
- All endpoints include proper error handling
