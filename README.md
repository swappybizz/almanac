# Time Dalo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)  
[![Next.js](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)](https://nextjs.org/)  
[![Node.js](https://img.shields.io/badge/Runtime-Node.js-green?logo=node.js)](https://nodejs.org/)  
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)](https://www.mongodb.com/)  
[![Clerk](https://img.shields.io/badge/Auth-Clerk-blue?logo=clerk)](https://clerk.com/)  

A sleek, open‑source time‑tracking and PWA (Progressive Web App) built with Next.js, Clerk for authentication, MongoDB for data storage, and rich visualizations for daily, weekly, and monthly logs. Export your logs as Excel files with a single click, install on mobile devices, and even generate repair estimates via image processing with OpenAI.

---
The app is available on the Apple App Store under the name **TimeDalo**.  
You can also access it directly at [timedalo.store](https://timedalo.store).  

---

## 🚀 Features

- **Daily Time Logging**  
  - Record start/end times for work sessions  
  - Automatic duration calculation, including overnight spans

- **Calendar View & Stats**  
  - Month‑at‑a‑glance calendar with per‑day hours  
  - Weekly, monthly, and all‑time average statistics  
  - Animated modals for editing and stats  

- **Excel Export**  
  - One‑click export of current project’s monthly log to `.xlsx`  

- **Progressive Web App**  
  - Service Worker registration & manifest  
  - Android “Install App” prompt  
  - iOS “Add to Home Screen” instructions  

- **Authentication & Authorization**  
  - Sign in/out flow powered by [Clerk](https://clerk.com/)  
  - Protected API routes for time logs, projects, invoices  

- **Projects & Observations**  
  - Create, list, and select multiple projects  
  - Paginated “observations” (invoices) API for future UI  

- **Automated Repair Estimation**  
  - `POST /api/process`  
  - Upload an image URL and let OpenAI identify parts & calculate costs  
  - Stores estimates in MongoDB for invoicing  

- **Modern UI/UX**  
  - Dark‑mode styling with Tailwind CSS  
  - Smooth animations via Framer Motion  
  - Charts powered by Recharts & custom rounded bars  

---

## 🛠️ Tech Stack

- **Framework**: Next.js (app & API routes)  
- **Language**: JavaScript / React  
- **Authentication**: Clerk (`@clerk/nextjs`)  
- **Database**: MongoDB (native driver, no Mongoose)  
- **Styling**: Tailwind CSS  
- **Charts & Animations**: Recharts, Framer Motion  
- **Date Utilities**: date‑fns  
- **Excel Export**: [`xlsx`](https://github.com/SheetJS/sheetjs)  
- **AI Integration**: OpenAI (GPT‑4.1) for image analysis  
- **Icons**: React Icons  

---

## 📥 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x  
- **MongoDB** instance (local or cloud)  
- Clerk account & application (API keys)  
- OpenAI account & API key  

### Environment Variables

Create a `.env.local` file at your project root:

```ini
MONGODB_URI="your_mongodb_connection_string"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
OPENAI_API_KEY="sk-..."
```

### Installation

```bash
git clone https://github.com/yourusername/time-dalo.git
cd time-dalo
npm install
```

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in via Clerk.

### Production Build

```bash
npm run build
npm start
```

---

## 📂 Project Structure

\`\`\`
.
├── components/         # Reusable React components (e.g., TimeCard, DayModal)
├── lib/
│   └── mongodb.js      # MongoDB connection (native driver)
├── pages/
│   ├── api/
│   │   ├── getTimeLog.js
│   │   ├── saveTimeLog.js
│   │   ├── projects.js
│   │   ├── observations.js
│   │   ├── process.js    # OpenAI image‑based repair estimator
│   ├── _app.js          # App-level setup: ClerkProvider, PWA hooks
│   ├── _document.js     # Custom HTML document: manifest, icons
│   ├── index.js         # Daily log & charts
│   ├── calendar.js      # Monthly calendar view
│   ├── settings.js      # App settings & PWA install instructions
│   └── login/           # Clerk sign‑in routes
├── public/
│   ├── manifest.json    # PWA manifest
│   └── icons/           # App icons
├── styles/
│   └── globals.css      # Global Tailwind imports
├── package.json
└── README.md            # ← you are here
\`\`\`

---

## 🤝 Contributing

Contributions are welcome! Whether it’s a feature request, bug fix, or documentation improvement, please follow these steps:

1. **Fork** the repository  
2. **Create** a feature branch:  
   ```bash
   git checkout -b feat/your-feature
   ```  
3. **Commit** your changes:  
   ```bash
   git commit -m "feat: add amazing feature"
   ```  
4. **Push** to your fork:  
   ```bash
   git push origin feat/your-feature
   ```  
5. **Open** a Pull Request against `main`  

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

> Built with ❤️ by [Your Name](https://github.com/yourusername)  
> ⭐️ If you find this project useful, please give it a star!  
