🚀 Authentication System (Node.js + Email Verification)

A secure authentication system built with Node.js, Express, MongoDB, and Resend for email verification and password reset.

✨ Features
🔐 User Registration & Login
✉️ Email Verification (token-based)
🔁 Resend Verification Email
🔑 Password Reset via Email
⏱️ Token Expiry (secure handling)
🔒 Hashed Tokens stored in database
🛠️ Tech Stack
Backend: Node.js, Express
Database: MongoDB + Mongoose
Email Service: Resend
Authentication: JWT
📁 Project Structure
server/
│── controllers/
│── models/
│── routes/
│── utils/
│── .env
│── server.js
⚙️ Installation
1. Clone the repo
git clone https://github.com/your-username/your-repo.git
cd your-repo
2. Install dependencies
npm install
3. Setup environment variables

Create a .env file:

MONGO_URL=your_mongodb_connection
JWT_SECRET=your_secret_key
RESEND_API_KEY=your_resend_api_key
APP_URL=http://localhost:8800/api/
▶️ Run the Project
npm run dev

Server will run on:

http://localhost:8800
📡 API Endpoints
🔐 Login
POST /api/users/login
✉️ Verify Email
GET /api/users/verify/:userId/:token
🔁 Resend Verification
POST /api/users/resend-verification
🔑 Request Password Reset
POST /api/users/request-password-reset
🔒 Reset Password
POST /api/users/reset-password/:userId/:token
🔄 Authentication Flow
User registers
Verification email is sent
User clicks verification link
Email is verified
User logs in successfully
⏱️ Token Expiry
Feature	Expiry Time
Email Verification	1 hour
Password Reset	10 minutes
⚠️ Important Notes
Ensure your email domain is verified in Resend
Tokens are hashed before saving to the database
Invalid or expired tokens are automatically rejected
🧪 Testing

You can test endpoints using:

Postman
Thunder Client (VS Code)
🤝 Contributing

Contributions are welcome!

Fork the repo
Create your feature branch
Commit your changes
Push and create a PR
📜 License

This project is licensed under the MIT License.

👨‍💻 Author

Developed by Jonie Mwash

⭐ Support

If you like this project:

⭐ Star the repo
🍴 Fork it
📢 Share it
💡 Next Improvements (Optional)
Swagger API Docs
Rate Limiting
Refresh Tokens
Social Login (Google, Facebook)

1 message remaining. Start a free Plus trial to keep the conversation going
Try Plus free
