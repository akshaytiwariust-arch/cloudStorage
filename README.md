# ☁️ CloudVault - Complete Cloud File Storage System

A modern, production-grade Cloud File Storage System with user authentication, file uploads (with 10 MB limit enforcement), user storage dashboard, file management, and a dedicated Administrator Control Center with Role-Based Access Control (RBAC).

---

## 🌟 Key Features

### 1. 🔐 Authentication & Security
- **Secure Registration & Login**: User signup and signin with input validation (email format, minimum password length).
- **Password Hashing**: Passwords stored using `bcrypt` (10 salt rounds).
- **Session/JWT Authentication**: Stateless JWT tokens (24-hour validity) passed via `Authorization: Bearer <token>` headers.
- **Route Protection**: Middleware protection on backend APIs (`/api/files`, `/api/admin`) and client-side guards preventing unauthorized access.
- **Strict Data Isolation**: Users can only see, download, or delete their own files. Preventing Insecure Direct Object References (IDOR).
- **SQL Injection Prevention**: Parameterized database queries across all endpoints.

### 2. 📁 File Upload System
- **Strict 10 MB Limit**: Strictly enforced both on the backend (`Multer` storage limits) and validated on the frontend before transmission.
- **Batch Uploads**: Supports uploading multiple files in a single request.
- **Live Upload Progress**: Real-time percentage progress bar via Axios upload progress tracking.
- **Safe Filename Generation**: Unique UUIDv4 filenames on disk to eliminate naming collisions and path traversal attacks while preserving the original filename in database metadata.
- **Category Detection & Icons**: Dynamic icon badges for Images, Documents, PDFs, Audio, Video, Archives, and Code scripts.

### 3. 📊 User Dashboard
- **Welcome Banner**: Displays personalized greeting with user's name.
- **Storage Metrics**: Total files count, storage consumed, remaining quota, and interactive visual progress bar against 100 MB quota.
- **File Management**: View, download, search by filename, filter by categories, and permanently delete files (removes database record and purges physical file on disk).
- **Dual Display Modes**: Table view and responsive Grid Card view.

### 4. 🛡️ Admin Panel (Protected Administrator Dashboard)
- **Role-Based Access Control**: Only accounts with `role = 'admin'` can access admin routes.
- **System Overview Metrics**: Total registered users, total platform files, and total global disk storage used.
- **User Governance**: View all registered users, registration dates, total files uploaded per user, and storage consumed.
- **User Management**: Administrator can delete any user account (cascading removal of all their uploaded files from server disk and DB). Self-deletion of the active admin is blocked.
- **Global Storage Audit**: View all files across all users with uploader details (name & email), download any file, and delete any file.

### 5. 🗄️ Database Dual-Engine Architecture
- **Primary: MySQL**: Standard MySQL 8.0+ schema with relational constraints (`FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`).
- **Zero-Config Fallback: SQLite**: Built-in automatic fallback to local SQLite database (`backend/database/cloud_storage.sqlite`) if MySQL is not configured yet or when running in local offline environments.

---

## 📁 Project Folder Structure

```text
cloud/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MySQL pool & SQLite connection abstraction
│   │   └── jwt.js                # JWT signing and verification helpers
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, and profile
│   │   ├── fileController.js     # Upload, list, download, delete, and stats
│   │   └── adminController.js    # Admin metrics, user governance, file audit
│   ├── database/
│   │   ├── schema.sql            # MySQL table definitions
│   │   ├── initDb.js             # Automated table creator script
│   │   └── seedAdmin.js          # Admin account creation / promotion CLI
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & requireAdmin checks
│   │   ├── uploadMiddleware.js   # Multer config (10MB limit, UUID filenames)
│   │   └── errorHandler.js       # Centralized error handler
│   ├── models/
│   │   ├── userModel.js          # User queries (parameterized)
│   │   └── fileModel.js          # File metadata & aggregate queries
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── fileRoutes.js         # /api/files endpoints
│   │   └── adminRoutes.js        # /api/admin endpoints
│   ├── uploads/                  # Physical file storage on disk
│   │   └── .gitkeep
│   ├── .env                      # Active backend environment variables
│   ├── .env.example              # Environment variables template
│   ├── package.json              # Backend dependencies
│   ├── server.js                 # Express server entry point & static server
│   └── test-suite.js             # Automated 17-point integration test runner
├── src/
│   ├── api/
│   │   └── client.js             # Axios client with JWT request interceptors
│   ├── components/
│   │   ├── FileIcon.jsx          # File category icon renderer
│   │   ├── Modal.jsx             # Reusable accessible dialog modal
│   │   ├── Navbar.jsx            # Header navigation & user status pill
│   │   └── UploadModal.jsx       # Drag-and-drop uploader with progress bar
│   ├── context/
│   │   ├── AuthContext.jsx       # Auth state, login/register, token storage
│   │   └── ToastContext.jsx      # Global toast notification alerts
│   ├── pages/
│   │   ├── LandingPage.jsx       # Modern landing page & feature highlights
│   │   ├── LoginPage.jsx         # Sign in with 1-click demo autofill
│   │   ├── RegisterPage.jsx      # Sign up form with validation
│   │   ├── UserDashboard.jsx     # User files, stats cards, search & filters
│   │   └── AdminDashboard.jsx    # Admin system overview, users & file audit
│   ├── utils/
│   │   └── formatters.js         # File size (KB/MB), date, & category utilities
│   ├── App.jsx                   # Main layout and client routing
│   ├── index.css                 # Tailwind CSS styles
│   └── main.jsx                  # React application entry
├── index.html                    # HTML shell
├── package.json                  # Root dependencies & convenience scripts
├── vite.config.js                # Vite configuration with /api backend proxy
└── README.md                     # Complete project documentation
```

---

## 🛠️ Technology Stack & Rationale

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 19 + Tailwind CSS + Lucide Icons | Provides a responsive, reactive UI with drag-and-drop file upload, live progress bar, instantaneous filtering, and dark-mode glassmorphic styling. |
| **Backend** | Node.js + Express.js | Lightweight, non-blocking asynchronous I/O ideal for file streaming, multipart uploads, and RESTful APIs. |
| **Database** | MySQL (with SQLite Auto-Fallback) | Relational SQL schema with foreign keys and cascade deletions. Automatic SQLite fallback ensures zero-configuration testing out-of-the-box. |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | Secure password hashing (10 salt rounds) and stateless, tamper-proof bearer tokens. |
| **File Upload** | `Multer` + `UUID` | Disk storage engine strictly capping file size at 10 MB per file, assigning collision-proof UUIDs. |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- MySQL Server (optional, will automatically fallback to SQLite if unconfigured)

### 1. Installation
Clone or navigate to the project directory and install dependencies:

```bash
# 1. Install frontend and root dependencies
npm install

# 2. Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment (`backend/.env`)
Copy `.env.example` to `.env` inside the `backend` folder:

```ini
PORT=5000
NODE_ENV=development

# Database Settings
# Set DB_CLIENT=mysql to connect to your MySQL server
DB_CLIENT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cloud_storage

# JWT Configuration
JWT_SECRET=super_secret_jwt_key_cloud_storage_987654321
JWT_EXPIRES_IN=24h

# File Upload Limit: 10 MB in bytes
MAX_FILE_SIZE=10485760

# Default Administrator Seed Account
ADMIN_EMAIL=admin@cloud.com
ADMIN_PASSWORD=Admin@12345
ADMIN_NAME=System Administrator
```

> **Note on MySQL vs SQLite**: If MySQL credentials are not provided or your MySQL server is offline, the backend seamlessly falls back to the embedded SQLite database (`backend/database/cloud_storage.sqlite`) so you can run and test immediately without configuring a database server!

---

## 👤 Creating the First Administrator Account

Run the dedicated seeding script from the root directory:

```bash
npm run seed:admin
```

Or run directly from the `backend` directory:
```bash
cd backend
node database/seedAdmin.js
```

You can also pass custom admin credentials via CLI:
```bash
node database/seedAdmin.js customadmin@cloud.com CustomPass@123 "Custom Admin"
```

**Default Admin Credentials:**
- **Email**: `admin@cloud.com`
- **Password**: `Admin@12345`
- **Role**: `admin`

---

## 🏃 Running the Application

### Option A: Run Both via Express (Single Port: 5000)
The backend is configured to serve the compiled frontend build directly:

```bash
# Build the frontend assets
npm run build

# Start the full-stack server
npm run server
```

Open your browser at: **`http://localhost:5000`**

---

### Option B: Development Mode (Vite Hot-Reload)
Run the backend API and frontend dev server in parallel:

**Terminal 1 (Backend API):**
```bash
npm run server
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Dev Server):**
```bash
npm run dev
# Running on http://localhost:3000 (proxies /api to http://localhost:5000)
```

Open your browser at: **`http://localhost:3000`**

---

## 🧪 Testing the Application End-to-End

### Running Automated Integration Tests
A comprehensive 17-point test suite is included in `backend/test-suite.js`:

```bash
cd backend
node test-suite.js
```

**Tests executed:**
1. Health check endpoint status
2. New user registration
3. Duplicate email prevention (409 Conflict)
4. Valid user login & JWT verification
5. Invalid password rejection (401 Unauthorized)
6. Authenticated user profile retrieval
7. Valid file upload (< 10 MB)
8. Oversized file rejection (> 10 MB returns 400 Bad Request)
9. User file listing & isolation
10. Administrator login & role verification
11. RBAC enforcement (normal user blocked from `/api/admin` with 403 Forbidden)
12. Administrator overview statistics
13. Administrator file audit with uploader details
14. Administrator file download
15. User file deletion (purges DB record and physical disk file)
16. Deletion verification
17. Administrator user deletion (with cascading file purging)

---

### Manual Testing Walkthrough

#### 1. Test User Registration & Login
1. Navigate to **`http://localhost:5000`** (or `http://localhost:3000` in dev).
2. Click **Get Started** or **Sign In**.
3. Create an account with your name, email, and password (min 6 characters).
4. Alternatively, on the Login page click **"User Account"** to autofill `alice@example.com` / `Password@123`.
5. Upon signing in, you are redirected to the **User Dashboard**.

#### 2. Test File Upload (Max 10 MB)
1. In your dashboard, click **Upload Files** (or use the button in the top navbar).
2. Drag and drop any file (PDF, image, document, archive) or click to browse.
3. Try uploading a file **larger than 10 MB**: notice the immediate rejection with an error toast message.
4. Try uploading valid files: watch the real-time upload progress bar reach 100%.
5. The dashboard updates immediately showing the new file, updated file count, and storage used.

#### 3. Test File Management
1. **Search**: Type in the search box to filter files in real time.
2. **Category Filter**: Click category pills (Documents, Images, PDFs, Code, Archives) to filter.
3. **View Mode**: Switch between **Table View** and **Grid View**.
4. **Download**: Click the download icon to verify the browser downloads the exact original file.
5. **Delete**: Click the trash icon; a confirmation modal will appear. Confirm deletion and verify the storage quota is freed.

#### 4. Test Admin Panel & Role-Based Access Control
1. Sign out of the normal user account.
2. Click **Sign In** and click the **"Admin Account"** button to autofill:
   - Email: `admin@cloud.com`
   - Password: `Admin@12345`
3. Click **Sign In**. Notice the **Admin Control Center** badge in the navbar and dashboard.
4. View **Global Stat Cards**: Total Registered Users, Total Stored Files, and Total Storage Occupied.
5. Under **Users Management**: View all registered users, their total files, and storage used.
6. Under **All Cloud Files**: View all files uploaded by every user with uploader name and email.
7. Test downloading or deleting any user's file as an Administrator.
8. Test deleting a test user account (all their files are automatically purged from the server).

---

## 📚 API Reference Documentation

### Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/register`
- **Description**: Registers a new user account.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account registered successfully.",
    "token": "eyJhbGciOi...",
    "user": {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "created_at": "2026-10-13T05:00:00.000Z"
    }
  }
  ```

#### `POST /api/auth/login`
- **Description**: Authenticates user or admin and issues a JWT token.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged in successfully.",
    "token": "eyJhbGciOi...",
    "user": {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    }
  }
  ```

#### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Retrieves current authenticated user profile and storage statistics.

---

### File Management Endpoints (`/api/files`)
*All file routes require `Authorization: Bearer <token>`.*

#### `POST /api/files/upload`
- **Content-Type**: `multipart/form-data`
- **Form Field**: `files` (one or multiple files, max 10MB each)
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "1 file(s) uploaded successfully.",
    "files": [
      {
        "id": 1,
        "user_id": 2,
        "original_filename": "project_report.pdf",
        "stored_filename": "b3e02534-1875-43ea-9fd3-40f9250db028.pdf",
        "file_type": "application/pdf",
        "file_size": 245760,
        "uploaded_at": "2026-10-13 05:02:00"
      }
    ],
    "stats": {
      "totalFiles": 1,
      "totalStorageBytes": 245760,
      "storageLimitBytes": 104857600,
      "availableStorageBytes": 104611840
    }
  }
  ```

#### `GET /api/files`
- **Query Params**: `?search=query` (optional)
- **Description**: Lists files belonging to the logged-in user.

#### `GET /api/files/:id/download`
- **Description**: Downloads the requested file. Checks that `file.user_id === req.user.id` or user is an admin.

#### `DELETE /api/files/:id`
- **Description**: Deletes the file database record and deletes physical file from `backend/uploads/`.

---

### Admin Endpoints (`/api/admin`)
*All admin routes require `Authorization: Bearer <token>` and `role === 'admin'`.*

#### `GET /api/admin/stats`
- **Description**: Returns system-wide totals (total users, total files, total storage bytes).

#### `GET /api/admin/users`
- **Description**: Lists all registered users along with their individual file counts and storage consumed.

#### `DELETE /api/admin/users/:id`
- **Description**: Deletes a user account and deletes all files uploaded by that user.

#### `GET /api/admin/files`
- **Query Params**: `?search=query` (optional)
- **Description**: Lists all files uploaded across all user accounts with uploader details.

#### `DELETE /api/admin/files/:id`
- **Description**: Allows an administrator to permanently delete any file.

#### `GET /api/admin/files/:id/download`
- **Description**: Allows an administrator to download any file stored in the platform.

---

## 🛡️ Security Architecture Summary

- **Bcrypt Password Storage**: Plaintext passwords are never stored or logged.
- **Stateless JWTs**: Tokens verified cryptographically with secret keys.
- **IDOR Protection**: File access is strictly checked against the requesting user's ID before serving or modifying.
- **Backend File Size Enforcement**: File sizes exceeding 10 MB are rejected at the HTTP multipart stream level.
- **Path Traversal Prevention**: Storage filenames use UUIDs, preventing directory traversal injection (`../../`).
- **SQL Injection Prevention**: All queries use parameterized statements (`?` placeholders).
