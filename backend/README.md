# ClearX Backend

Express.js backend for the ClearX e-commerce platform.

## Setup

1. **Install dependencies**:

   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file** (copy from `.env.example`):

   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**:

   - `MONGO_URI`: MongoDB connection string
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_PRIVATE_KEY`: Firebase service account private key
   - `FIREBASE_CLIENT_EMAIL`: Firebase service account email
   - `JWT_SECRET`: Secret key for JWT signing
   - `PORT`: Server port (default: 5000)

4. **Start the server**:
   ```bash
   npm start          # Production
   npm run dev        # Development (with nodemon)
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with Firebase OTP
- `POST /api/auth/logout` - Logout

### Products

- `GET /api/products` - Get all products (supports filters: vertical, category, search)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders

- `GET /api/orders` - Get user orders (authenticated)
- `POST /api/orders` - Create order (authenticated)
- `PUT /api/orders/:id` - Update order status (authenticated)
- `DELETE /api/orders/:id` - Cancel order (authenticated)

### Users

- `GET /api/users/profile` - Get user profile (authenticated)
- `PUT /api/users/profile` - Update user profile (authenticated)
- `GET /api/users/wishlist` - Get user wishlist (authenticated)
- `POST /api/users/wishlist/add` - Add to wishlist (authenticated)
- `POST /api/users/wishlist/remove` - Remove from wishlist (authenticated)
- `POST /api/users/upgrade-seller` - Upgrade to seller (authenticated)

## Project Structure

```
backend/
├── config/
│   └── firebase.js       # Firebase Admin SDK config
├── models/
│   ├── User.js          # User schema
│   ├── Product.js       # Product schema
│   └── Order.js         # Order schema
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── products.js      # Product routes
│   ├── orders.js        # Order routes
│   └── users.js         # User routes
├── middleware/
│   └── auth.js          # JWT verification middleware
├── server.js            # Main server file
├── package.json
├── .env.example
└── README.md
```

## Technologies Used

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Firebase Admin SDK** - Authentication & services
- **JWT** - Token-based authentication
- **CORS** - Cross-origin resource sharing

## Notes

- All authenticated routes require a JWT token in the `Authorization` header: `Bearer <token>`
- Products are stored in MongoDB for persistence
- User data syncs between Firebase Auth and MongoDB
- Orders track order status from confirmation to delivery
