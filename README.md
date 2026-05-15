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

## Notes

- Make sure the backend server is running before starting the frontend
- Both your phone and computer must be on the **same WiFi network**
- The `.env` file is not pushed to GitHub for security reasons — create it manually
