# 🚀 Job Application Tracker - Backend

> **A robust, secure, and scalable backend API for the Job Application Tracker, built with Node.js, Express, and Sequelize.**

## 📖 Table of Contents

- [🌟 Project Overview](#-project-overview)
- [📚 The Journey So Far](#-the-journey-so-far)
- [🚀 Features](#-features)
- [🛠️ Technical Stack](#️-technical-stack)
- [📁 Project Structure](#-project-structure)
- [🔧 Installation & Setup](#-installation--setup)
- [🔐 Authentication & Security](#-authentication--security)
- [🗃️ Database Schema](#️-database-schema)
- [🌐 API Endpoints](#-api-endpoints)
- [⚙️ Middleware Architecture](#️-middleware-architecture)
- [🔧 Error Handling](#-error-handling)
- [📈 Performance & Scalability](#-performance--scalability)
- [🤝 Contributing](#-contributing)

## 🌟 Project Overview

### What is this project about?

This is the backend server that powers the **Job Application Tracker**. It's the "engine" of the application, responsible for handling all the data, business logic, and security. It provides a comprehensive **RESTful API** that the frontend application consumes to deliver a seamless user experience.

### For Non-Technical Users

Think of the backend as the "brain" of the operation. When you save a new job application, upload a resume, or update your profile, the frontend sends that information to this backend. The backend then:
- 🧠 **Processes** the request
- 💾 **Stores** the data securely in the database
- 🔒 **Ensures** that only you can access your own information
- 📤 **Sends** the correct data back to the frontend to be displayed

### For Technical Users

This is a modern, production-ready backend built with **Node.js** and **Express**. It uses **Sequelize** as an ORM for database interactions, supporting both **SQLite** for development and **PostgreSQL** for production. The architecture is modular, secure, and designed for scalability.

## 📚 The Journey So Far

### 🎬 Project Genesis
This backend was the first phase of **Project #20**, a comprehensive job application tracking system. The goal was to build a solid foundation that could support a feature-rich frontend and future enhancements like NLP-powered resume optimization.

### 🏗️ Development Timeline

#### Phase 1: Core Setup & Database (Completed ✅)
- Set up **Node.js/Express** server with modern best practices
- Chose **Sequelize** as the ORM for database flexibility
- Designed and implemented **7 interconnected database models**
- Configured for both **SQLite** (development) and **PostgreSQL** (production)

#### Phase 2: Authentication & Security (Completed ✅)
- Implemented **JWT-based authentication** with secure password hashing (bcrypt)
- Created **authentication middleware** to protect routes
- Added **rate limiting** to prevent brute-force attacks
- Integrated **Helmet** for security headers and **CORS** for cross-origin requests

#### Phase 3: API Development (Completed ✅)
- Built **comprehensive REST API** with full CRUD operations for all models
- Implemented **advanced features** like search, filtering, pagination, and sorting
- Developed **input validation** using `express-validator`
- Created a **centralized error handling** mechanism

#### Phase 4: Bug Fixes & Refinements (Ongoing 🔄)
- **Database Compatibility**: Resolved differences between SQLite and PostgreSQL (`like` vs `iLike`)
- **Deletion Logic**: Implemented transaction-based deletion to handle foreign key constraints in SQLite
- **Security Hardening**: Continuously reviewing and improving security measures

### 🎯 Current Status
- **API**: 100% functional with comprehensive endpoints
- **Database**: Stable schema with robust associations
- **Authentication**: Fully implemented and secure
- **Security**: Production-ready with multiple layers of protection
- **Scalability**: Designed for growth with a modular architecture

## 🚀 Features

### 🔐 Authentication & Authorization
- **Secure Registration**: With strong password requirements and email validation
- **JWT-based Login**: Generates secure, expiring tokens
- **Protected Routes**: Middleware ensures only authenticated users can access data
- **Role-based Access**: (Future-ready) Schema supports different user roles

### 🗃️ Database & Data Management
- **ORM-based**: Uses Sequelize for clean, maintainable database code
- **Database Agnostic**: Supports SQLite for easy setup and PostgreSQL for production
- **Complex Associations**: Manages relationships between users, applications, companies, and documents
- **Cascading Deletes**: Ensures data integrity when records are removed

### 🌐 Comprehensive REST API
- **Full CRUD Operations**: For all major resources (applications, companies, documents)
- **Advanced Querying**: Supports search, filtering, pagination, and sorting
- **Analytics Endpoints**: Provides aggregated data for the frontend dashboard
- **NLP Integration**: Endpoints to connect with a future NLP service for resume analysis

### 🛡️ Security
- **Password Hashing**: Uses `bcryptjs` to securely store passwords
- **Security Headers**: `Helmet` helps protect against common web vulnerabilities
- **Rate Limiting**: Prevents brute-force and denial-of-service attacks
- **Input Validation**: `express-validator` sanitizes and validates all incoming data
- **CORS Protection**: Whitelists allowed frontend origins

### 📄 File Handling
- **Secure File Uploads**: Uses `multer` for handling resume and document uploads
- **File Size Limits**: Prevents excessively large file uploads
- **File Storage**: Configurable to store files locally or in cloud storage (future)

## 🛠️ Technical Stack

### Core Technologies
- **🟢 Node.js 18+**: JavaScript runtime for building the server
- **🚀 Express.js 4.x**: Fast, unopinionated web framework for Node.js
- **🗃️ Sequelize 6.x**: Modern ORM for Node.js (supports PostgreSQL, MySQL, SQLite, etc.)
- **💾 SQLite3**: For local development and easy setup
- **🐘 PostgreSQL**: For production-level robustness and scalability

### Security
- **🔐 JSON Web Token (JWT)**: For secure, stateless authentication
- **🔑 Bcrypt.js**: For hashing passwords
- **🛡️ Helmet**: For securing Express apps with various HTTP headers
- **🚦 CORS**: For enabling cross-origin resource sharing
- **⏱️ Express Rate Limit**: For limiting repeated requests to public APIs

### Middleware & Tooling
- **📝 Morgan**: For HTTP request logging
- **📦 Multer**: For handling `multipart/form-data` (file uploads)
- **✅ Express Validator**: For input validation and sanitization
- **💨 Compression**: For Gzip compressing responses
- **⚙️ Nodemon**: For automatic server restarts during development
- ** dotenv**: For managing environment variables

### Testing
- **🃏 Jest**: JavaScript testing framework
- **🕵️ Supertest**: For testing HTTP assertions

## 📁 Project Structure

```
backend/
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── errorHandler.js     # Centralized error handler
│   └── rateLimiter.js      # Request rate limiting
├── models/
│   ├── User.js             # User model and schema
│   ├── Company.js          # Company model
│   ├── JobApplication.js   # Job application model
│   ├── Document.js         # Document model
│   ├── StatusHistory.js    # Tracks application status changes
│   ├── Keyword.js          # For NLP features
│   ├── ApplicationKeyword.js # Join table for keywords
│   └── index.js            # Sequelize setup and model associations
├── routes/
│   ├── auth.js             # Authentication routes (login, register)
│   ├── applications.js     # CRUD for job applications
│   ├── companies.js        # CRUD for companies
│   ├── documents.js        # File upload/download routes
│   ├── analytics.js        # Analytics data endpoints
│   └── nlp.js              # Routes for NLP service
├── .env.example            # Example environment variables
├── database.sqlite         # SQLite database file (for development)
├── package.json            # Project dependencies and scripts
└── server.js               # Main application entry point
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js 18+**
- **npm or yarn**
- **Git**

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd jobapplicationtracker/backend
```

#### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3. Environment Configuration
Create a `.env` file in the `backend` root by copying `.env.example`:
```bash
cp .env.example .env
```
Update the `.env` file with your settings. For local development with SQLite, you only need to set:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
```

#### 4. Start the Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

### Available Scripts
- `npm start`: Starts the server in production mode.
- `npm run dev`: Starts the server in development mode with `nodemon` for auto-restarts.
- `npm test`: Runs tests using Jest.

## 🔐 Authentication & Security

### Authentication Flow
1. **Registration**: User provides details, password is hashed with `bcrypt` and stored.
2. **Login**: User provides credentials. Server compares hashed password.
3. **Token Generation**: On successful login, a **JWT** is generated, containing the user's ID.
4. **Token Storage**: The token is sent to the frontend, which stores it securely.
5. **Authenticated Requests**: Frontend sends the JWT in the `Authorization` header for all protected requests.
6. **Middleware Verification**: The `auth.js` middleware verifies the token on every protected request, ensuring the user is valid and active.

### Security Measures
- **Stateless Authentication**: JWTs make the system stateless and scalable.
- **Token Expiry**: Tokens have a limited lifetime to reduce the risk of misuse.
- **Strong Password Hashing**: `bcrypt` with a salt round of 12.
- **Route Protection**: Sensitive routes are protected by the `auth` middleware.
- **Input Validation**: All user input is validated to prevent injection attacks.

## 🗃️ Database Schema

The database consists of **7 interconnected models**:

- **User**: Stores user credentials and profile information.
- **Company**: Stores information about companies.
- **JobApplication**: The core model, linking a `User` to a `Company` for a specific job.
- **Document**: Stores metadata for uploaded files (resumes, cover letters).
- **StatusHistory**: Logs every status change for a `JobApplication`, creating a timeline.
- **Keyword**: Stores keywords extracted from job descriptions (for future NLP features).
- **ApplicationKeyword**: A join table linking `JobApplication` and `Keyword`.

### Key Relationships
- `User` has many `JobApplications`.
- `Company` has many `JobApplications`.
- `JobApplication` belongs to one `User` and one `Company`.
- `JobApplication` has many `Documents` and many `StatusHistory` records.
- `JobApplication` has a many-to-many relationship with `Keyword`.

This relational structure ensures data integrity and enables powerful queries.

## 🌐 API Endpoints

All endpoints are prefixed with `/api`.

### Authentication (`/auth`)
- `POST /register`: Create a new user.
- `POST /login`: Authenticate a user and get a JWT.
- `GET /me`: Get the current authenticated user's profile.
- `PUT /profile`: Update the user's profile.
- `PUT /change-password`: Change the user's password.

### Job Applications (`/applications`)
- `GET /`: Get all applications with filtering, sorting, and pagination.
- `POST /`: Create a new application.
- `GET /:id`: Get details of a single application.
- `PUT /:id`: Update an application.
- `DELETE /:id`: Delete an application.
- `GET /stats/overview`: Get analytics data for the dashboard.

### Companies (`/companies`)
- `GET /`: Get all companies with search and pagination.
- `POST /`: Create a new company.
- `GET /:id`: Get details of a single company.
- `GET /search/:query`: Search for companies by name.

### Documents (`/documents`)
- `GET /`: Get a list of all uploaded documents for the user.
- `POST /upload`: Upload a new document.
- `GET /:id`: Download a specific document.
- `DELETE /:id`: Delete a document.

### Analytics (`/analytics`)
- `GET /status-distribution`: Get the count of applications per status.
- `GET /application-timeline`: Get application activity over time.

## ⚙️ Middleware Architecture

Middleware is used extensively to create a clean and modular request-response pipeline.

### Key Middleware
- `helmet()`: Adds security headers.
- `cors()`: Handles Cross-Origin Resource Sharing.
- `compression()`: Compresses response bodies.
- `morgan()`: Logs HTTP requests.
- `express.json()`: Parses JSON request bodies.
- `rateLimiter`: Applies rate limiting to all requests.
- `auth.js`: Protects routes by verifying JWTs.
- `errorHandler.js`: A centralized function to catch and format all errors.

### Request Pipeline
1. Request comes in.
2. Security and logging middleware run (`helmet`, `cors`, `morgan`).
3. Body parsing and rate limiting (`express.json`, `rateLimiter`).
4. Routing directs the request to the correct handler.
5. `auth` middleware runs on protected routes.
6. Route handler processes the request.
7. Response is sent.
8. If any error occurs, it's caught by the `errorHandler`.

## 🔧 Error Handling

A robust, centralized error handling strategy is in place.

### `errorHandler.js`
This single middleware is responsible for catching all errors that occur in the application and sending a consistent, formatted JSON response.

### Features
- **Catches Synchronous & Asynchronous Errors**: Using `asyncHandler` wrappers.
- **Handles Specific Error Types**: Differentiates between `Sequelize` errors (e.g., `ValidationError`, `UniqueConstraintError`), `JWT` errors, and custom application errors.
- **Consistent Response Format**: All errors return a JSON object with `success: false`, a `message`, and other relevant details.
- **Development vs. Production**: Provides detailed stack traces in development for easier debugging, but hides them in production for security.

### Example Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "timestamp": "2025-09-30T12:00:00.000Z",
  "path": "/api/auth/register",
  "method": "POST",
  "details": {
    "errors": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters long"
      }
    ]
  }
}
```

## 📈 Performance & Scalability

### Performance Measures
- **Response Compression**: `gzip` is used to reduce the size of API responses.
- **Efficient Database Queries**: Sequelize helps write optimized queries, and pagination prevents fetching large datasets at once.
- **Connection Pooling**: Sequelize manages a pool of database connections to reduce latency.
- **Asynchronous Operations**: Node.js's non-blocking I/O is leveraged for all database and file system operations.

### Scalability
- **Stateless Architecture**: The use of JWTs means the application can be scaled horizontally across multiple server instances without session management issues.
- **Modular Design**: The codebase is organized into logical modules (routes, models, middleware), making it easy to maintain and extend.
- **Environment-based Configuration**: The server can be easily configured for different environments (development, staging, production).

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines.

### Development Workflow
1. **Set up the environment** as described in the [Installation](#-installation--setup) section.
2. **Create a new branch** for your feature or bug fix: `git checkout -b feature/my-new-feature`.
3. **Write your code**, following the existing style and conventions.
4. **Add tests** for any new functionality.
5. **Ensure all tests pass**: `npm test`.
6. **Submit a pull request** with a clear description of your changes.

### Code Style
- Follow the existing code style.
- Use descriptive variable and function names.
- Comment complex logic.

---

**Built with ❤️ using Node.js, Express, and Sequelize.**

> This backend is the backbone of the Job Application Tracker, providing a secure, reliable, and scalable API. It showcases best practices in modern backend development, from security and database design to error handling and performance.

---

*Last updated: September 30, 2025*