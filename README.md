# Smart Event Booking

Full-stack event booking app with **Node.js (Express + Prisma + MySQL)** backend and **React (Vite + Tailwind + Framer Motion)** frontend.  
Users can browse & book events, admins can manage events via a dashboard.

---

##  Setup

### 1. Clone Repo
git clone https://github.com/yourusername/event-booking-system.git
cd event-booking-system


### 2. Install Dependencies
# Backend
cd Server
npm install

# Frontend
cd ../Client
npm install

### 2. Set Environment Variables for both Client and Server 
the env example is alerady pushed , checkout from there .

### 3. Init DB
npx prisma generate
npx prisma migrate dev --name init
npm run seed   # seeds admin + sample events

### 4. Run App
# Backend
cd Server
npm run dev   # http://localhost:4000

# Frontend
cd ../Client
npm run dev   # http://localhost:5173

### Tech Stack
Backend: Node.js, Express, Prisma, MySQL, JWT
Frontend: React (Vite), Tailwind CSS, Framer Motion
Extras: Socket.IO (real-time seats), QR tickets

