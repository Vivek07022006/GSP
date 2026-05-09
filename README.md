# Guide Selection & Review Management Portal

A full-stack web application for managing student project guide allocation and multi-stage review workflows in an academic institution.

## 🚀 Features

- **Role-Based Access Control**: Separate dashboards for Students, Faculty (Guides), and Admins.
- **Team Formation**: Students can form teams of up to 2 members.
- **Guide Selection (Zeroth Review)**: Students can select a guide. Guides can approve or reject the request. If rejected, students are notified and can select another guide.
- **Sequential Review Flow**: Reviews (0 to 6) are sequentially unlocked.
- **Submission & Feedback**: Students submit their documents. Guides can only approve/comment once a file has been submitted.
- **Notification System**: Students are notified of approvals and rejections instantly.

## 🛠 Tech Stack

- **Frontend**: Vite + React, Tailwind CSS, React Router, Lucide Icons
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT Auth
- **File Uploads**: Multer

## 📦 Project Structure

- `/frontend` - Contains the Vite React UI
- `/backend` - Contains the Express APIs and MongoDB Models

## 🏃 Getting Started

### 1. Database Setup
Ensure you have MongoDB running locally on `127.0.0.1:27017` or update the `.env` file in the `backend` directory with your MongoDB Atlas URI.

### 2. Backend
\`\`\`bash
cd backend
npm install
# Seed the database with demo users
node seed.js
# Start the server
npm run dev
\`\`\`

### 3. Frontend
\`\`\`bash
cd frontend
npm install
# Start the Vite development server
npm run dev
\`\`\`

## 🔑 Demo Credentials

- **Admin**: `admin@test.com` / `password`
- **Faculty**: `faculty@test.com` / `password`
- **Student**: `student@test.com` / `password`
