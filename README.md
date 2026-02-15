# Resume Parser - NLP-Based Candidate Screening

![Resume Parser](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/License-MIT-green)

A production-ready Resume Parser application that helps Human Resource Managers screen candidates using Natural Language Processing (NLP) techniques.

## 🎯 Features

- **User Authentication**: Email authentication via Supabase
- **Job Analysis**: Extract skills, roles, and requirements from job descriptions
- **Resume Parsing**: Automatic extraction from **PDF, TXT, DOCX** files
- **Smart Matching**: Levenshtein distance-based fuzzy skill matching
- **Ranked Results**: Candidates sorted by match score

## 📝 Supported File Formats

✅ **PDF** - Fully supported  
✅ **TXT** - Fully supported  
✅ **DOCX** - Fully supported (Word 2007+)  
✅ **JPG/PNG** - With OCR (requires Tesseract)  
❌ **DOC** - Not supported (Word 97-2003 format)

> **Note**: If you have .doc files, please save them as .docx format:  
> Open in Word → File → Save As → Word Document (*.docx)

## 🧠 NLP Concepts Implemented

- ✅ **Tokenization**: Breaking text into meaningful units
- ✅ **Lemmatization**: Reducing words to their root form (WordNetLemmatizer)
- ✅ **Stemming**: Porter Stemmer for word root extraction
- ✅ **Stopword Removal**: Filtering out common words
- ✅ **Levenshtein Distance**: Custom implementation for fuzzy string matching
- ✅ **Keyword Extraction**: TF-based importance scoring

## 🏗️ System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend   │────────▶│  Supabase   │
│  (Next.js)  │  API    │  (FastAPI)  │  Auth   │  (Database) │
│   Vercel    │         │   Render    │  Data   │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Tech Stack

**Frontend**:
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Supabase Auth UI

**Backend**:
- FastAPI
- Python 3.9+
- NLTK (NLP)
- PyPDF2 (PDF parsing)
- Levenshtein (similarity matching)

**Database & Auth**:
- Supabase

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Git
- Supabase account

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# Run server
python main.py
```

Backend will run on `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
resume-parser/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── nlp_processor.py     # NLP pipeline (tokenization, lemmatization, etc.)
│   ├── resume_parser.py     # Resume text extraction and parsing
│   ├── job_analyzer.py      # Job description analysis
│   ├── matcher.py           # Levenshtein-based matching
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Login page
│   │   ├── dashboard/       # Main dashboard
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── lib/
│   │   └── supabase.ts      # Supabase client
│   └── package.json         # Node dependencies
│
└── README.md
```

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable Email and Google auth providers
3. Copy your project URL and anon key
4. Update `.env` files in both backend and frontend

### Environment Variables

**Backend** (`.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📡 API Endpoints

### `GET /`
Health check

### `POST /api/analyze-job`
Analyze job description
```json
{
  "description": "Looking for Python developer...",
  "keywords": ["python", "react", "5 years"]
}
```

### `POST /api/parse-resumes`
Parse uploaded resumes

### `POST /api/match`
Match resumes to job requirements

## 🚢 Deployment

### Backend (Render)

1. Create new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

### Frontend (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd frontend`
3. Run: `vercel`
4. Follow prompts
5. Add environment variables in Vercel dashboard

## 🧪 Testing

```bash
# Test backend
cd backend
python -m pytest

# Test NLP processor
python -c "from nlp_processor import NLPProcessor; nlp = NLPProcessor(); print(nlp.process('Testing tokenization and lemmatization'))"
```

## 📊 How It Works

1. **User Login**: Authenticate with email via Supabase
2. **Job Input**: Enter job description or keywords
3. **Upload Resumes**: Upload multiple PDF/TXT/DOCX files
4. **Processing**:
   - Extract text from resumes
   - Tokenize and lemmatize both job and resume text
   - Remove stopwords
   - Extract skills and keywords
5. **Matching**:
   - Compare resume skills with job requirements
   - Use Levenshtein distance for fuzzy matching
   - Calculate match percentage
6. **Results**: View ranked candidates with match scores

## 🎓 NLP Techniques Explained

### Tokenization
Breaks text into individual words/tokens:
```
"Python Developer" → ["Python", "Developer"]
```

### Lemmatization
Reduces words to their root form:
```
"running" → "run", "better" → "good"
```

### Stopword Removal
Filters common words with little meaning:
```
["the", "python", "is", "great"] → ["python", "great"]
```

### Levenshtein Distance
Measures similarity between strings:
```
distance("python", "pyton") = 1
similarity = 0.83 (83% match)
```

## 📝 License

MIT License - feel free to use for academic or commercial purposes

## 👨‍💻 Author

Built as an NLP course project demonstrating practical application of NLP concepts in HR technology.

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ using NLP techniques**
