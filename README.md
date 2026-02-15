# AI-Powered Resume Matcher

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.1-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An intelligent recruitment automation tool built with Natural Language Processing to streamline candidate evaluation and job-resume matching for HR professionals.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
- [Technology Stack](#technology-stack)
- [NLP Implementation](#nlp-implementation)
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [API Documentation](#api-documentation)
- [Deployment Guide](#deployment-guide)
- [Usage Examples](#usage-examples)

---

## Overview

This application leverages advanced NLP algorithms to automate the resume screening process, helping recruiters efficiently identify top candidates by analyzing and matching resume content against job requirements. The system processes multiple document formats and provides ranked candidate lists based on intelligent skill matching.

### What Makes This Different?

- **Fuzzy Matching Algorithm**: Implements Levenshtein distance calculations for approximate string matching, handling typos and variations in skill descriptions
- **Multi-format Support**: Processes PDF, DOCX, and TXT files seamlessly
- **Real-time Processing**: FastAPI backend ensures quick response times even with batch uploads
- **Modern UI**: Built with Next.js 14 and Shadcn UI components for a professional user experience

---

## Core Capabilities

### 🔐 Authentication System
Secure email-based authentication powered by Supabase, ensuring data privacy and user session management.

### 📄 Document Processing
Extracts structured information from various resume formats:
- **PDF Files** (via PyPDF2)
- **Word Documents** (DOCX format, Word 2007 and later)
- **Plain Text** (TXT files)
- **OCR Support** (JPG/PNG with Tesseract - optional)

> ⚠️ **Legacy Format Note**: .DOC files (Word 97-2003) require conversion to .DOCX format before processing.

### 🧮 Intelligent Matching Engine
The core matching algorithm performs:
1. Text normalization and preprocessing
2. Skill extraction from both resumes and job descriptions
3. Fuzzy similarity computation using edit distance metrics
4. Weighted scoring based on keyword importance
5. Ranked output with detailed match analytics

### 📊 Result Visualization
Candidates are presented with:
- Overall match percentage
- Detailed skill alignment breakdown
- Missing qualifications highlight
- Matched competencies list

---

## Technology Stack

### Frontend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.1 | React framework with App Router |
| TypeScript | 5.x | Type-safe development |
| Shadcn UI | Latest | Component library |
| TailwindCSS | 3.3 | Utility-first styling |
| Supabase Client | Latest | Authentication & data layer |

### Backend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.104+ | High-performance API framework |
| Python | 3.9+ | Primary language |
| NLTK | 3.8+ | Natural language processing |
| PyPDF2 | 3.x | PDF text extraction |
| python-docx | Latest | Word document parsing |
| Levenshtein | Latest | String similarity metrics |

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (Frontend) + Render (Backend)

---

## NLP Implementation

This project demonstrates practical applications of fundamental NLP techniques:

### 1. **Text Tokenization**
Splits raw text into discrete linguistic units (tokens) for analysis.
```
Input:  "Senior Software Engineer with Python experience"
Output: ["Senior", "Software", "Engineer", "with", "Python", "experience"]
```

### 2. **Lemmatization via WordNet**
Converts words to their dictionary base form while preserving meaning.
```
"developing" → "develop"
"engineers" → "engineer"
"better" → "good"
```

### 3. **Porter Stemming**
Applies rule-based suffix stripping to normalize word variants.
```
"programming" → "program"
"developer" → "develop"
```

### 4. **Stopword Filtering**
Removes high-frequency, low-information words to focus on meaningful content.
```
Before: ["the", "best", "python", "developer", "in", "the", "team"]
After:  ["best", "python", "developer", "team"]
```

### 5. **Levenshtein Distance**
Computes edit distance between strings to enable fuzzy matching.
```
compare("JavaScript", "Javascript") → distance: 1, similarity: 90%
compare("Python", "Pyhton") → distance: 2, similarity: 66%
```

### 6. **TF-based Keyword Ranking**
Identifies important terms using term frequency analysis to weight skill relevance.

---

---

## Getting Started

### System Requirements

Before installation, ensure your development environment has:

- **Python** 3.9 or higher
- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase** account (free tier available)

### Installation Steps

#### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd resume-parser
```

#### Step 2: Backend Configuration

Navigate to the backend directory and set up a Python virtual environment:

```bash
cd backend

# Create isolated Python environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

Create a `.env` file in the backend directory with your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
```

Launch the development server:

```bash
python main.py
```

The API will be accessible at `http://localhost:8000`

#### Step 3: Frontend Configuration

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend

# Install Node.js dependencies
npm install
```

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the Next.js development server:

```bash
npm run dev
```

Access the application at `http://localhost:3000`

### Supabase Configuration

1. Navigate to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings** → **API** to find your project URL and anon key
3. Enable **Email** authentication in **Authentication** → **Providers**
4. (Optional) Run the SQL schema from `database/schema.sql` for database features

---

## Project Architecture

### Directory Structure

```
resume-parser/
│
├── backend/                    # Python FastAPI server
│   ├── main.py                # Application entry point & API routes
│   ├── nlp_processor.py       # Text preprocessing pipeline
│   ├── resume_parser.py       # Document parsing logic
│   ├── job_analyzer.py        # Job description processing
│   ├── matcher.py             # Similarity computation engine
│   ├── models.py              # Data models & schemas
│   ├── database.py            # Database operations
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment configuration
│
├── frontend/                   # Next.js 14 application
│   ├── app/                   # App router pages
│   │   ├── page.tsx          # Landing & authentication
│   │   ├── dashboard/        # Main application interface
│   │   ├── layout.tsx        # Root layout component
│   │   └── globals.css       # Global styling
│   ├── components/           # Shadcn UI components
│   ├── lib/                  # Utility functions
│   │   └── supabase.ts      # Supabase client configuration
│   ├── package.json          # Node dependencies
│   └── .env.local           # Environment variables
│
├── database/                  # Database resources
│   ├── schema.sql            # PostgreSQL schema
│   └── DATABASE_SETUP.md     # Setup instructions
│
├── temp/                      # Temporary files & test data
│   └── test-resumes/         # Sample resumes for testing
│
└── README.md                  # This file
```

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                        │
│                     (React/Next.js App)                       │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Resume   │→ │     NLP      │→ │   Matcher    │         │
│  │   Parser   │  │  Processor   │  │   Engine     │         │
│  └────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬─────────────────────────────────┘
                             │ SQL
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                           │
│           PostgreSQL + Authentication Services                 │
└──────────────────────────────────────────────────────────────┘
```

---

## API Documentation

### Health Check

**GET** `/`

Returns server status and confirms API availability.

**Response:**
```json
{
  "status": "active",
  "message": "Resume Parser API is running"
}
```

### Analyze Job Description

**POST** `/api/analyze-job`

Extracts skills, requirements, and keywords from a job posting.

**Request Body:**
```json
{
  "description": "We are seeking a Python developer with 5+ years experience...",
  "keywords": ["python", "django", "postgresql"]
}
```

**Response:**
```json
{
  "extracted_skills": ["python", "django", "postgresql", "api"],
  "experience_requirements": "5+ years",
  "processed_text": "..."
}
```

### Parse Resumes

**POST** `/api/parse-resumes`

Processes uploaded resume files and extracts candidate information.

**Request:** Multipart form data with file uploads

**Response:**
```json
{
  "resumes": [
    {
      "filename": "john_doe.pdf",
      "extracted_text": "...",
      "skills": ["python", "java", "sql"],
      "email": "john@example.com"
    }
  ]
}
```

### Match Resumes to Job

**POST** `/api/match`

Compares resumes against job requirements and returns ranked results.

**Request:** Multipart form data with files + JSON payload

**Response:**
```json
{
  "matches": [
    {
      "filename": "candidate1.pdf",
      "match_score": 87.5,
      "matched_skills": ["python", "django", "rest"],
      "missing_skills": ["docker", "kubernetes"],
      "confidence": "high"
    }
  ]
}
```

---

---

## Deployment Guide

### Deploying the Backend (Render)

[Render](https://render.com) offers free hosting for FastAPI applications with automatic deployments from Git.

**Steps:**

1. Create a Render account and connect your GitHub repository
2. Click **New** → **Web Service**
3. Configure the service:
   - **Name**: `resume-parser-api`
   - **Environment**: Python 3
   - **Build Command**: 
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command**: 
     ```bash
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
4. Add environment variables in the Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
5. Click **Create Web Service**

Your API will be live at `https://your-service.onrender.com`

### Deploying the Frontend (Vercel)

[Vercel](https://vercel.com) provides optimal hosting for Next.js applications with zero configuration.

**Steps:**

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Navigate to your frontend directory:
   ```bash
   cd frontend
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Follow the interactive prompts:
   - Link to existing project or create new
   - Select the `frontend` directory as root
   - Accept default settings

5. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)

6. Trigger redeployment for variables to take effect

Your application will be accessible at `https://your-project.vercel.app`

---

## Usage Examples

### Example 1: Basic Resume Matching

1. **Sign in** with your email address
2. **Navigate** to the "Match Resumes" tab
3. **Enter** a job description:
   ```
   Looking for a Full Stack Developer with expertise in React, Node.js, 
   and PostgreSQL. Must have 3+ years of experience building scalable 
   web applications.
   ```
4. **Upload** resume files (PDF/DOCX/TXT)
5. **Click** "Analyze Resumes"
6. **Review** ranked candidates with match scores

### Example 2: Keyword-Based Search

1. Toggle **"Use Keywords Instead"**
2. Enter specific requirements:
   ```
   React, Node.js, PostgreSQL, Docker, AWS, 3 years
   ```
3. Upload resumes and analyze
4. System prioritizes exact keyword matches

### Example 3: Resume Library Management

1. Navigate to **"Resume Library"** (requires authentication)
2. View all previously processed resumes
3. Click on any resume to see:
   - Extracted skills
   - Contact information
   - Full parsed content
4. Delete outdated entries as needed

---

## Testing the Application

### Backend Testing

Run the included test suite:

```bash
cd backend
python -m pytest tests/
```

### Manual API Testing

Test individual NLP components:

```bash
python -c "
from nlp_processor import NLPProcessor
nlp = NLPProcessor()
result = nlp.process('Software Engineer position requiring Python and Java')
print(result)
"
```

### Testing File Upload

Use cURL to test resume parsing:

```bash
curl -X POST http://localhost:8000/api/parse-resumes \
  -F "files=@test_resume.pdf" \
  -F "files=@test_resume2.pdf"
```

---

## How the Matching Algorithm Works

The system employs a multi-stage pipeline to evaluate candidate fit:

### Stage 1: Text Extraction
Documents are parsed to extract raw text content, preserving structure where possible.

### Stage 2: Preprocessing
Both job descriptions and resumes undergo:
- Tokenization into word units
- Conversion to lowercase
- Lemmatization to base forms
- Stopword removal
- Special character filtering

### Stage 3: Feature Extraction
The NLP engine identifies:
- Technical skills and tools
- Education qualifications
- Experience indicators
- Domain-specific terminology

### Stage 4: Similarity Computation
For each resume-job pair:
1. Calculate Levenshtein distance for each skill term
2. Apply threshold-based filtering (e.g., 80% similarity)
3. Weight matches by term frequency importance
4. Aggregate to produce overall match percentage

### Stage 5: Ranking & Output
Candidates are sorted by match score (descending) with detailed breakdowns:
- ✅ Matched skills
- ⚠️ Partial matches
- ❌ Missing requirements

---

## Understanding NLP Concepts in Context

### Why Lemmatization Matters

Consider these resume variations:
- "Developed RESTful APIs"
- "Developing microservices"
- "Developer with API experience"

Without lemmatization, these might be treated as different skills. With it, the system recognizes "develop," "developer," and "developing" as the same core competency.

### The Power of Fuzzy Matching

Candidates often list skills differently than job postings:
- Job: "JavaScript" vs Resume: "Javascript"
- Job: "PostgreSQL" vs Resume: "Postgres"
- Job: "React.js" vs Resume: "ReactJS"

Levenshtein distance-based matching handles these variations intelligently, preventing false negatives.

### Term Frequency Weighting

Not all keywords are equally important. Skills mentioned multiple times in a job description receive higher weight in the matching algorithm, reflecting their elevated priority.

---

## Troubleshooting

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'nltk'`
- **Solution**: Activate virtual environment and run `pip install -r requirements.txt`

**Issue**: NLTK data not found
- **Solution**: Run in Python shell:
  ```python
  import nltk
  nltk.download('punkt')
  nltk.download('stopwords')
  nltk.download('wordnet')
  ```

**Issue**: Supabase authentication fails
- **Solution**: Verify environment variables are correctly set and Supabase project is active

**Issue**: PDF parsing fails
- **Solution**: Ensure PyPDF2 is installed. For scanned PDFs, consider adding Tesseract OCR support

**Issue**: CORS errors in browser
- **Solution**: Check that `NEXT_PUBLIC_API_URL` matches your backend URL exactly

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

---

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute this software for personal or commercial purposes with attribution.

---

## Acknowledgments

- **NLTK** for comprehensive NLP toolkit
- **FastAPI** for elegant API framework
- **Next.js** team for excellent React framework
- **Supabase** for backend-as-a-service platform
- **Shadcn UI** for beautiful component library

---

## Contact & Support

For questions, bug reports, or feature requests:

- Open an issue on GitHub
- Check existing documentation in `/docs` folder
- Review the API documentation at `/api/docs` when running locally

---

**Project developed as part of Natural Language Processing coursework, demonstrating practical applications of NLP in solving real-world HR challenges.**

**Last Updated**: February 2026
