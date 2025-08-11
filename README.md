# 🔗 Secure URL Shortener

A **production-ready, full-stack URL shortener** application with complete user authentication and data isolation.  
Built with **TypeScript**, **Node.js**, **Express**, **MongoDB**, and **Firebase Authentication**.  

Each user has a private dashboard to manage their URLs and view personal analytics.

---

## ✨ Features

- **Secure Authentication** – User registration and login powered by Firebase.
- **User Data Isolation** – Each user's data is private and inaccessible to others.
- **URL Shortening** – Convert long URLs into short, manageable links.
- **Personal Dashboard** – Private dashboard with analytics for your shortened URLs.
- **Visit Tracking** – Real-time click analytics for each URL.
- **Responsive Design** – Fully responsive, works seamlessly on desktop and mobile.

---

## 🏗️ Tech Stack

### **Frontend**
- **TypeScript** – Type-safe, maintainable code.
- **Vite** – Fast build tool and dev server.
- **Firebase Auth** – Client-side user authentication.

### **Backend**
- **Node.js + Express** – Lightweight, fast server for API requests.
- **MongoDB + Mongoose** – NoSQL database for flexible storage.
- **Firebase Admin** – Server-side verification of user tokens.

---

## 🚀 Quick Start

Follow these steps to get a local copy running:

### **Prerequisites**
- **Node.js** (v16 or higher)
- **MongoDB Atlas** (or a local MongoDB instance)
- **Firebase Project** with Email/Password Authentication enabled

### **1. Clone the Repository**
```bash
git clone https://github.com/not-amarnath/url-shortner.git
cd url-shortner
````

### **2. Install Dependencies**

```bash
npm install
```

### **3. Configure Environment Variables**

Create a `.env` file in the root directory and add:

```env
# MongoDB Connection String
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/<database-name>"

# Firebase Configuration (replace with your own values)
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

> **Important:** Add `.env` to `.gitignore` to prevent committing secrets.

### **4. Run the Application**

```bash
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 📄 License

This project is licensed under the **MIT License**.
See the [LICENSE](./LICENSE) file for details.

```
