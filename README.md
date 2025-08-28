# ReWear - Clothing Swap & Points Marketplace

A modern swap-based clothing marketplace where users can exchange clothes and earn points through feedback system.

## 🌟 Features

### Core Features
- **Bidirectional Feedback System** - Both users can give feedback to each other after swaps
- **Points-based Economy** - Earn points through positive feedback and use them for purchases
- **Real-time Notifications** - Live notification count and indicators in navbar
- **Swap Management** - Complete swap lifecycle from request to completion
- **User Dashboard** - Manage listings, view statistics, and track transactions

### Technical Features
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-time Updates** - Notification polling every 10 seconds
- **Smooth Animations** - Framer Motion for enhanced UX
- **Modern UI** - Tailwind CSS for clean, modern interface
- **Admin Panel** - Separate admin dashboard for platform management

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Real-time notifications** system

### Admin
- **Separate React app** for admin operations
- **Dashboard analytics**
- **User and listing management**

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Roshan-Singh-06/Rewearthese.git
   cd Rewearthese
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file with your MongoDB connection
   echo "MONGODB_URI=your_mongodb_connection_string" > .env
   echo "JWT_SECRET=your_jwt_secret" >> .env
   
   # Start backend server
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Start frontend development server
   npm run dev
   ```

4. **Admin Panel Setup (Optional)**
   ```bash
   cd ../admin-frontend
   npm install
   
   # Start admin panel
   npm run dev
   ```

## 📁 Project Structure

```
Rewearthese/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── controllers/       # API controllers
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   ├── middlewares/      # Custom middlewares
│   │   └── config/           # Database config
│   └── package.json
├── frontend/                   # React user interface
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   └── contexts/        # React contexts
│   └── package.json
├── admin-frontend/            # Admin dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```

## 🎯 How It Works

### Swap Process
1. **Browse Items** - Users browse available clothing items
2. **Request Swap** - Send swap request to item owner
3. **Accept/Reject** - Owner can accept or reject the swap
4. **Item Exchange** - Both parties exchange items
5. **Feedback** - Both users give feedback about item condition
6. **Points Reward** - Seller earns points based on feedback

### Feedback System
- **Bidirectional** - Both users can rate each other
- **Condition-based** - Rate items as Excellent, Good, Fair, or Poor
- **Points Award** - Automatic point calculation based on ratings
- **Loop Prevention** - Users can only give feedback once per swap

### Notification System
- **Real-time Indicators** - Green dot and count badge in navbar
- **Auto-refresh** - Updates every 10 seconds
- **Event-driven** - Instant updates when actions are performed

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/rewear
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Swaps
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/:id/accept` - Accept swap
- `PUT /api/swaps/:id/reject` - Reject swap

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/:id` - Get feedback details

## 👨‍💻 Author

**Roshan Singh**
- GitHub: [@Roshan-Singh-06](https://github.com/Roshan-Singh-06)
- Repository: [Rewearthese](https://github.com/Roshan-Singh-06/Rewearthese)

## 🙏 Acknowledgments

- Built for Odoo Hackathon 2025
- Thanks to all contributors and testers
- Special thanks to the React and Node.js communities

---

⭐ Star this repo if you found it helpful!
