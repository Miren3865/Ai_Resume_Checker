# MERN Career Match — Resume Analysis & Job Matching Platform

A transparent career intelligence platform that converts resumes and job descriptions into data-driven insights using TF-IDF, cosine similarity, and rule-based scoring.

---

## Features

- **Resume Upload** — Upload PDF or DOCX resumes with automatic text extraction and section parsing
- **Job Description Management** — Create and manage job postings with required/preferred skills and keywords
- **Career Match Score** — Weighted scoring across 5 dimensions (Skills, Experience, Education, Keywords, Formatting)
- **TF-IDF Cosine Similarity** — Semantic text comparison between resume and job description
- **Skill Gap Detection** — Matched vs missing skills and keywords
- **Section Quality Analysis** — Evaluate contact, summary, experience, education, skills, projects, certifications, achievements
- **Recommendation Engine** — Prioritized (HIGH/MEDIUM/LOW) improvement suggestions
- **Visual Analytics** — Donut chart, radar chart, score breakdown bars
- **Resume Battle** — Compare multiple candidates against the same job with ranked output
- **Configurable Weights** — Admin-adjustable scoring weights
- **JWT Authentication** — Secure routes with role-based access (candidate / recruiter / admin)

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, Chart.js, Axios   |
| Backend     | Node.js, Express.js, Multer, pdf-parse, mammoth |
| NLP         | natural (TF-IDF, stemming), stopword            |
| Database    | MongoDB Atlas, Mongoose                          |
| Auth        | JWT, bcryptjs                                   |

---

## Scoring Formula

```
Match Score = (0.35 × Skills) + (0.25 × Experience) + (0.15 × Education) + (0.15 × Keywords) + (0.10 × Formatting)
```

### Grade System

| Score   | Grade             |
|---------|-------------------|
| 90–100  | A+                |
| 80–89   | A                 |
| 70–79   | B                 |
| 60–69   | C                 |
| < 60    | Needs Improvement |

---

## Project Structure

```
mern-career-match/
├── server/
│   ├── config/         # Database connection
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, upload, error handler
│   ├── models/         # Mongoose schemas (User, Resume, JobDescription, Evaluation)
│   ├── routes/         # Express routers
│   ├── utils/          # fileParser, resumeParser, nlpEngine, scoringEngine
│   └── index.js        # Entry point
├── client/
│   └── src/
│       ├── api/         # Axios instance + service functions
│       ├── components/  # Reusable UI (DonutChart, RadarChart, ScoreBar, SkillTag, SectionCard, RecommendationCard)
│       ├── context/     # AuthContext
│       └── pages/       # Dashboard, Resumes, Jobs, Evaluations, Battle, Login, Register
├── uploads/             # Temporary file storage (auto-deleted after parsing)
└── package.json         # Root scripts
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)

### 2. Clone and install

```bash
# Install all dependencies
npm run install:all
```

### 3. Configure environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/resumechecker?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_secret_here
PORT=5000
NODE_ENV=development
```

### 4. Run development servers

Open two terminals:

**Terminal 1 — Backend:**
```bash
npm run dev:server
```

**Terminal 2 — Frontend:**
```bash
npm run dev:client
```

Open [http://localhost:3000](http://localhost:3000)

### 5. First steps

1. Register an account at `/register`
2. Upload a resume (PDF/DOCX) at `/resumes`
3. Create a job description at `/jobs`
4. Run an evaluation at `/evaluations/new`
5. View full analysis results with charts and recommendations

---

## API Endpoints

| Method | Endpoint                         | Description                     |
|--------|----------------------------------|---------------------------------|
| POST   | /api/auth/register               | Register user                   |
| POST   | /api/auth/login                  | Login                           |
| GET    | /api/auth/me                     | Get current user                |
| POST   | /api/resumes/upload              | Upload + parse resume           |
| GET    | /api/resumes                     | List resumes                    |
| GET    | /api/resumes/:id                 | Get resume by ID                |
| DELETE | /api/resumes/:id                 | Delete resume                   |
| POST   | /api/jobs                        | Create job description          |
| GET    | /api/jobs                        | List job descriptions           |
| GET    | /api/jobs/:id                    | Get job by ID                   |
| PUT    | /api/jobs/:id                    | Update job                      |
| DELETE | /api/jobs/:id                    | Delete job                      |
| POST   | /api/evaluations                 | Run evaluation                  |
| GET    | /api/evaluations                 | List evaluations                |
| GET    | /api/evaluations/:id             | Get evaluation detail           |
| DELETE | /api/evaluations/:id             | Delete evaluation               |
| POST   | /api/evaluations/battle          | Resume battle (multi-compare)   |
| GET    | /api/evaluations/stats/dashboard | Dashboard statistics            |

---

## Security

- JWT authentication on all protected routes
- Multer file type + size validation (PDF/DOCX, max 10MB)
- Path traversal prevention on file uploads
- CORS restricted to known origins
- Mongoose schema validation
- bcrypt password hashing (12 rounds)
- Input sanitization via express-validator

---

## License

MIT
"# Ai_Resume_Checker" 
