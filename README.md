# CampusCare — Smart Facility Management System
Report • Track • Resolve

CampusCare is a mobile application that allows university community members to report facility issues, and enables facility managers and workers to manage and resolve them efficiently.

---

## Team

| Name | Role |
|---|---|
| Joy Bassem | Team Lead / Full-stack |
| Hana Khaled | Database / Backend |
| Malak Fawzy | Database / Backend |
| Maryam Basim | Frontend |
| Mohamed Adel | Frontend |
| Adam Sherbiny | Frontend / Backend |

---

## Prerequisites

Make sure you have the following installed before starting:

- [Node.js](https://nodejs.org) (v18 or higher)
- npm (comes with Node.js)
- [Expo Go](https://expo.dev/go) app on your phone (iOS or Android)
- A [Supabase](https://supabase.com) PostgreSQL database (already configured)
- A [Cloudinary](https://cloudinary.com) account (already configured)

---

## Backend Setup

### 1. Navigate to the backend folder

```
cd backend
```

### 2. Install dependencies

```
npm install
```

### 3. Create the environment variables file

Create a file named `.env` inside the `backend` folder and add the following:

```
PORT=5000
JWT_SECRET=Joy_CampusCare_Lead_2026
DATABASE_URL=postgresql://postgres.awficeuoxyjjfngculru:CampusCare_Lead_2026@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
CLOUDINARY_CLOUD_NAME=dhhkao9wz
CLOUDINARY_API_KEY=458893962383142
CLOUDINARY_API_SECRET=l6g667vwxME7z3QYeVUOsgyw-IQ
```

### 4. Set up the database

- Open your [Supabase SQL Editor](https://supabase.com/dashboard)
- Run `schema.sql` first to create all tables
- Run `seed.sql` to insert sample/test data

### 5. Start the backend server

```
node index.js
```

The server will start on `http://localhost:5000`

You should see: `Server started on http://localhost:5000`

---

## Frontend Setup

### 1. Navigate to the frontend folder

```
cd frontend
```

### 2. Install dependencies

```
npm install
```

### 3. Set your computer's IP address

- Open `frontend/src/services/api.js`
- Find the line: `const BASE_URL = 'http://...'`
- Replace the IP with your computer's local IP address

To find your IP:
- **Windows**: Open cmd → type `ipconfig` → look for **IPv4 Address**
- **Mac**: Open terminal → type `ifconfig | grep inet`

Example:
```js
const BASE_URL = 'http://192.168.1.55:5000/api';
```

### 4. Start the frontend

```
npx expo start
```

### 5. Open on your phone

- Download **Expo Go** from the App Store or Google Play
- Scan the QR code that appears in the terminal
- The app will open on your phone

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default: 5000) |
| `JWT_SECRET` | Secret key for JWT token signing |
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## Project Structure

```
campuscare-app/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handler logic
│   │   ├── middleware/      # Auth middleware (JWT verification)
│   │   ├── routes/          # API route definitions
│   │   └── db/              # Database connection
│   ├── index.js             # Server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── screens/         # All app screens
│   │   ├── navigation/      # Navigation setup
│   │   └── services/        # API calls (api.js)
│   ├── App.js               # App entry point
│   └── package.json
│
└── README.md
```
## Backend (/backend)
src/controllers/: Contains the business logic for each route (e.g., creating issues, authenticating users).

src/middleware/: Handles security functions, specifically the JWT verification to protect private routes.

src/routes/: Defines the API endpoint paths and connects them to the appropriate controllers.

src/db/: Manages the connection pool and configurations for the Supabase PostgreSQL database.

index.js: The main entry point that initializes the Express server.

## Frontend (/frontend)
src/screens/: Houses all UI views, organized by function (e.g., Login, Issue Tracking, Role Dashboards).

src/navigation/: Defines the navigation structure, including separate navigators for each user role (Admin, FM, CM, Worker).

src/services/: Contains api.js, which serves as a centralized hub for all backend communication logic.

App.js: The root file that initializes the application and the main Navigation Container.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |
| POST | `/api/auth/logout` | Logout |

### Issues (Tickets)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/issues` | Get all issues | Facility Manager |
| GET | `/api/issues/my` | Get my issues | Community Member |
| GET | `/api/issues/:id` | Get issue by ID | All |
| POST | `/api/issues` | Submit new issue | Community Member |
| PUT | `/api/issues/:id/status` | Update issue status | FM / Worker |
| DELETE | `/api/issues/:id` | Delete issue | Facility Manager |

---

## User Roles

| Role | Access |
|---|---|
| `community_member` | Submit issues, view own issues |
| `facility_manager` | View all issues, update status, assign workers, close/delete |
| `worker` | View assigned issues, update status, add comments |
| `admin` | Full system access |

---

## Notes

- Make sure the backend server is running before starting the frontend
- Both your phone and computer must be on the **same WiFi network**
- The `.env` file is not pushed to GitHub for security reasons — create it manually
