# 🧠 SolveMate — Cloud-Native DSA Practice Platform

> A full-stack DSA question tracking and practice platform built with Express.js, MongoDB Atlas, and EJS, deployed as a cloud-native application with Docker containerization and CI/CD.

🌐 **Live Demo:** [https://solvemate-lzfl.onrender.com](https://solvemate-lzfl.onrender.com)

---

## ✨ Features

### Core Features
- 📝 **DSA Question Bank** — Browse 500+ curated questions from top companies
- 🔍 **Smart Filtering** — Filter by difficulty (Easy/Medium/Hard), company (Google/Amazon/Microsoft), and topic tags
- ✅ **Progress Tracking** — Mark questions as solved and track your progress
- 🔐 **User Authentication** — Secure signup/login with bcrypt password hashing and session management

### Cloud & API Features
- 🌐 **REST API** — Full JSON API at `/api/v1/` for external consumers
- 💬 **Answers System** — Post answers, upvote the best ones
- 📊 **Statistics Endpoint** — Get question distribution by difficulty, company, and tag
- 🔎 **Search API** — Full-text search across questions
- 🏥 **Health Check** — `/health` endpoint for cloud monitoring and load balancers

### Cloud-Native Architecture
- 🐳 **Docker** — Containerized with multi-stage Dockerfile
- 🔄 **CI/CD** — Automated testing and deployment via GitHub Actions
- 🔒 **Security** — Helmet, CORS, rate limiting, secure sessions
- 📈 **Monitoring** — Structured JSON logging, `/metrics` endpoint
- ⚡ **Performance** — Gzip compression, query caching

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────────────────────────┐
│   Browser   │────▶│     Render.com (Cloud Platform)       │
│   / Client  │     │  ┌──────────────────────────────────┐ │
└─────────────┘     │  │   Express.js Application         │ │
                    │  │  ┌────────┐  ┌───────────────┐   │ │
                    │  │  │Helmet  │  │Rate Limiter   │   │ │
                    │  │  │CORS    │  │Compression    │   │ │
                    │  │  │Morgan  │  │Session Mgmt   │   │ │
                    │  │  └────────┘  └───────────────┘   │ │
                    │  │  ┌────────────────────────────┐   │ │
                    │  │  │  Routes                     │  │ │
                    │  │  │  ├── /api/v1/* (REST API)   │  │ │
                    │  │  │  ├── /health (monitoring)   │  │ │
                    │  │  │  └── /* (EJS Views)         │  │ │
                    │  │  └────────────────────────────┘   │ │
                    │  └──────────────────────────────────┘ │
                    └──────────────┬───────────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │   MongoDB Atlas (Free M0 Cluster)│
                    │   ├── users                      │
                    │   ├── questions                   │
                    │   ├── answers                     │
                    │   └── sessions                    │
                    └──────────────────────────────────┘
```

---

## 📁 Project Structure

```
SolveMate/
├── .github/workflows/deploy.yml   # CI/CD pipeline
├── Dockerfile                     # Container definition
├── docker-compose.yml             # Local dev setup
├── app.js                         # Express app entry point
├── package.json
│
├── config/
│   └── logger.js                  # Structured JSON logger
│
├── middleware/
│   ├── auth.js                    # Auth guards (view + API)
│   └── errorHandler.js            # Centralized error handling
│
├── models/
│   ├── answer.js                  # Answer schema (voting, refs)
│   ├── question.js                # Question schema
│   └── user.js                    # User schema
│
├── routes/
│   ├── api/                       # REST API routes
│   │   ├── index.js               # API router + docs
│   │   ├── questions.js           # Question CRUD + search
│   │   ├── auth.js                # Auth endpoints
│   │   └── answers.js             # Answer CRUD + voting
│   ├── authHandler.js             # View auth routes
│   ├── requestHandler.js          # View question routes
│   └── user.js                    # User action routes
│
├── views/                         # EJS templates
│   ├── auth/                      # Login, signup, dashboard
│   ├── partials/                  # Reusable components
│   └── index.ejs                  # Question listing
│
└── utils/
    └── pathUtils.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas account (free M0 cluster)
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/brijesh-shetty/SolveMate.git
cd SolveMate

# Copy environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Install dependencies
npm install

# Start development server
npm run dev
```

### Using Docker

```bash
# Build and run
docker build -t solvemate .
docker run -p 3000:3000 --env-file .env solvemate

# Or use Docker Compose
docker-compose up --build
```

---

## 📡 API Reference

### Base URL: `/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1` | ❌ | API info & available endpoints |
| `GET` | `/health` | ❌ | Health check + DB status |
| `GET` | `/metrics` | ❌ | Server metrics |
| **Questions** | | | |
| `GET` | `/api/v1/questions` | ❌ | List questions (paginated + filters) |
| `GET` | `/api/v1/questions/stats` | ❌ | Question statistics by category |
| `GET` | `/api/v1/questions/search?q=` | ❌ | Search questions |
| `GET` | `/api/v1/questions/:id` | ❌ | Get single question |
| `POST` | `/api/v1/questions/:id/solve` | ✅ | Toggle solved status |
| **Answers** | | | |
| `GET` | `/api/v1/answers/question/:id` | ❌ | List answers for a question |
| `POST` | `/api/v1/answers/question/:id` | ✅ | Post an answer |
| `POST` | `/api/v1/answers/:id/upvote` | ✅ | Upvote/un-upvote an answer |
| `DELETE` | `/api/v1/answers/:id` | ✅ | Delete own answer |
| **Auth** | | | |
| `POST` | `/api/v1/auth/signup` | ❌ | Create account |
| `POST` | `/api/v1/auth/login` | ❌ | Log in |
| `POST` | `/api/v1/auth/logout` | ✅ | Log out |
| `GET` | `/api/v1/auth/me` | ✅ | Get current user profile |

### Example: Filter Questions
```bash
curl "https://solvemate-lzfl.onrender.com/api/v1/questions?difficulty=EASY&company=Google&page=1&limit=10"
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| **HTTP Security Headers** | Helmet.js (CSP, HSTS, X-Frame, etc.) |
| **Rate Limiting** | 100 req/15min general, 20 req/15min auth |
| **CORS** | Configurable origin whitelist |
| **Password Hashing** | bcrypt with 12 salt rounds |
| **Session Security** | httpOnly, secure, sameSite cookies |
| **Input Validation** | express-validator on all inputs |
| **Error Sanitization** | Stack traces hidden in production |

---

## ☁️ Cloud Deployment

### Platform: Render.com (Free Tier)
- **Web Service**: Auto-deploys from GitHub `main` branch
- **Database**: MongoDB Atlas M0 (512MB free forever)
- **CI/CD**: GitHub Actions runs tests → Docker build → auto-deploy

### Environment Variables (set in Render dashboard)

| Variable | Description |
|----------|-------------|
| `DB_PATH` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Random secret for session signing |
| `NODE_ENV` | Set to `production` |
| `PORT` | `3000` (Render sets this automatically) |
| `CORS_ORIGIN` | Your domain URL |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express.js 5 |
| Database | MongoDB Atlas (Mongoose 8) |
| Views | EJS Templates |
| Auth | bcrypt + express-session |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Structured JSON (Morgan + custom) |
| Container | Docker (Alpine) |
| CI/CD | GitHub Actions |
| Cloud | Render.com |

---

## 📄 License

ISC License
