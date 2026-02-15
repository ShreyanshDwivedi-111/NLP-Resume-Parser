"""
Resume Parser Backend - FastAPI Application
Simple and clean implementation for NLP-based resume screening
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from dotenv import load_dotenv
from datetime import datetime
import uuid

from nlp_processor import NLPProcessor
from resume_parser import ResumeParser
from job_analyzer import JobAnalyzer
from matcher import ResumeMatcher
from database import DatabaseService

# Load environment variables
load_dotenv()

# Initialize database service (optional for basic matching)
try:
    db_service = DatabaseService()
    DB_ENABLED = True
    print("✅ Database service initialized")
except Exception as e:
    print(f"⚠️  Database disabled: {e}")
    print("📝 Basic matching will work, but history/library features disabled")
    db_service = None
    DB_ENABLED = False

# Initialize FastAPI app
app = FastAPI(title="Resume Parser API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],  # Update with Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NLP components
nlp_processor = NLPProcessor()
resume_parser = ResumeParser(nlp_processor)
job_analyzer = JobAnalyzer(nlp_processor)
matcher = ResumeMatcher()


# Pydantic models
class JobInput(BaseModel):
    description: Optional[str] = None
    keywords: Optional[List[str]] = None


class MatchResponse(BaseModel):
    filename: str
    score: float
    matched_skills: List[str]
    extracted_data: dict


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "active",
        "message": "Resume Parser API is running",
        "version": "1.0.0",
        "database": "enabled" if DB_ENABLED else "disabled",
        "supabase_url_set": bool(os.getenv("SUPABASE_URL")),
        "supabase_key_set": bool(os.getenv("SUPABASE_SERVICE_KEY"))
    }


@app.post("/api/analyze-job")
async def analyze_job(job_input: JobInput):
    """
    Analyze job description and extract skills, roles, experience
    Uses NLP techniques: tokenization, lemmatization, stopword removal
    """
    try:
        if job_input.description:
            analysis = job_analyzer.analyze(job_input.description)
            return {
                "success": True,
                "extracted_skills": analysis['skills'],
                "roles": analysis['roles'],
                "experience": analysis['experience'],
                "keywords": analysis['keywords']
            }
        elif job_input.keywords:
            return {
                "success": True,
                "extracted_skills": [],
                "roles": [],
                "experience": None,
                "keywords": job_input.keywords
            }
        else:
            raise HTTPException(400, "Provide either description or keywords")
    
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@app.post("/api/parse-resumes")
async def parse_resumes(files: List[UploadFile] = File(...)):
    """
    Parse uploaded resumes and extract information
    Supports PDF and TXT formats
    """
    results = []
    
    for file in files:
        try:
            # Save temporarily
            temp_path = f"temp_{file.filename}"
            content = await file.read()
            with open(temp_path, "wb") as f:
                f.write(content)
            
            # Parse resume
            parsed_data = resume_parser.parse(temp_path)
            results.append({
                "filename": file.filename,
                "success": True,
                "data": parsed_data
            })
            
            # Cleanup
            os.remove(temp_path)
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    return {"results": results}


@app.post("/api/match", response_model=List[MatchResponse])
async def match_resumes(
    job_input: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Match resumes against job requirements
    Returns ranked candidates with match scores
    Uses Levenshtein distance for skill matching
    """
    try:
        # Parse job_input JSON
        job_data = json.loads(job_input)
        
        # Analyze job
        if job_data.get('description'):
            job_analysis = job_analyzer.analyze(job_data['description'])
            required_skills = job_analysis['skills'] + job_analysis['keywords']
        else:
            # Use NLP techniques for better keyword matching
            raw_keywords = job_data.get('keywords', [])
            required_skills = []
            for keyword in raw_keywords:
                clean_keyword = keyword.strip().lower()
                # Add original keyword
                required_skills.append(clean_keyword)
                # Tokenize first (required for lemmatization and stemming)
                tokens = nlp_processor.tokenize(clean_keyword)
                # Add lemmatized version (converts to dictionary form)
                lemmatized_tokens = nlp_processor.lemmatize(tokens)
                required_skills.extend(lemmatized_tokens)
                # Add stemmed version (more aggressive, finds word roots)
                # This helps match: tester → test, testing → test
                stemmed_tokens = nlp_processor.stem(tokens)
                required_skills.extend(stemmed_tokens)
                
                # Manually add "test" for "tester" since Porter Stemmer doesn't stem it
                if clean_keyword == 'tester':
                    required_skills.append('test')
            
            # Remove duplicates while preserving order
            seen = set()
            required_skills = [x for x in required_skills if not (x in seen or seen.add(x))]
        
        # Parse all resumes
        candidates = []
        for file in files:
            temp_path = f"temp_{file.filename}"
            content = await file.read()
            with open(temp_path, "wb") as f:
                f.write(content)
            
            # Parse and match
            try:
                resume_data = resume_parser.parse(temp_path)
                
                # Check if parsing was successful
                if 'error' in resume_data:
                    candidates.append({
                        "filename": file.filename,
                        "score": 0.0,
                        "matched_skills": [],
                        "extracted_data": {
                            "error": resume_data['error'],
                            "skills": [],
                            "keywords": []
                        }
                    })
                    continue
                
                match_result = matcher.match(resume_data, required_skills)
                
                candidates.append({
                    "filename": file.filename,
                    "score": match_result['score'],
                    "matched_skills": match_result['matched_skills'],
                    "extracted_data": resume_data
                })
            except Exception as e:
                error_msg = str(e)
                print(f"ERROR processing {file.filename}: {error_msg}")
                candidates.append({
                    "filename": file.filename,
                    "score": 0.0,
                    "matched_skills": [],
                    "extracted_data": {
                        "error": error_msg,
                        "skills": [],
                        "keywords": []
                    }
                })
            
            os.remove(temp_path)
        
        # Sort by score (highest first)
        candidates.sort(key=lambda x: x['score'], reverse=True)
        
        return candidates
    
    except Exception as e:
        raise HTTPException(500, f"Matching failed: {str(e)}")


# ==================== DATABASE-INTEGRATED ENDPOINTS ====================

def get_user_id(authorization: str = Header(None)) -> str:
    """Extract user ID from JWT token in authorization header"""
    if not DB_ENABLED:
        raise HTTPException(503, "Database features are disabled. Please configure SUPABASE credentials.")
    if not authorization:
        raise HTTPException(401, "Authorization header required")
    
    # Extract JWT token from Bearer header
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(401, "Invalid authorization token")
    
    try:
        import base64
        # JWT tokens have 3 parts: header.payload.signature
        # We need the payload (middle part)
        parts = token.split('.')
        if len(parts) != 3:
            raise HTTPException(401, "Invalid JWT token format")
        
        # Decode the payload (add padding if needed)
        payload_encoded = parts[1]
        # Add padding for base64 decoding
        padding = 4 - len(payload_encoded) % 4
        if padding != 4:
            payload_encoded += '=' * padding
        
        payload_json = base64.urlsafe_b64decode(payload_encoded)
        payload = json.loads(payload_json)
        
        # Extract user_id from 'sub' field
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(401, "No user ID found in token")
        
        return user_id
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        raise HTTPException(401, f"Invalid token: {str(e)}")


@app.post("/api/match-and-save", response_model=List[MatchResponse])
async def match_and_save_resumes(
    job_input: str = Form(...),
    files: List[UploadFile] = File(...),
    authorization: str = Header(None)
):
    """
    Match resumes and save everything to database
    Saves: resumes, job search, and match results
    Falls back to simple matching if database unavailable
    """
    try:
        user_id = get_user_id(authorization)
        
        # Check if database is available
        if not DB_ENABLED or not db_service:
            # Fallback to simple matching without saving
            return await match_resumes(job_input, files)
        
        # Parse job_input JSON
        job_data = json.loads(job_input)
        
        # Analyze job
        if job_data.get('description'):
            job_analysis = job_analyzer.analyze(job_data['description'])
            required_skills = job_analysis['skills'] + job_analysis['keywords']
            
            # Save job search to database
            job_search_data = {
                'user_id': user_id,
                'job_title': job_data.get('title'),
                'job_description': job_data['description'],
                'use_keywords': False,
                'required_skills': job_analysis['skills'],
                'required_roles': job_analysis['roles'],
                'required_experience': job_analysis.get('experience')
            }
        else:
            # Process keywords
            raw_keywords = job_data.get('keywords', [])
            required_skills = []
            for keyword in raw_keywords:
                clean_keyword = keyword.strip().lower()
                required_skills.append(clean_keyword)
                tokens = nlp_processor.tokenize(clean_keyword)
                lemmatized_tokens = nlp_processor.lemmatize(tokens)
                required_skills.extend(lemmatized_tokens)
                stemmed_tokens = nlp_processor.stem(tokens)
                required_skills.extend(stemmed_tokens)
                if clean_keyword == 'tester':
                    required_skills.append('test')
            
            required_skills = list(dict.fromkeys(required_skills))  # Remove duplicates
            
            # Save job search to database
            job_search_data = {
                'user_id': user_id,
                'keywords': raw_keywords,
                'use_keywords': True,
                'required_skills': required_skills
            }
        
        # Save job search
        saved_job = db_service.save_job_search(job_search_data)
        job_search_id = saved_job['id']
        
        # Parse all resumes and save to database
        candidates = []
        for file in files:
            temp_path = f"temp_{file.filename}"
            content = await file.read()
            with open(temp_path, "wb") as f:
                f.write(content)
            
            try:
                resume_data = resume_parser.parse(temp_path)
                
                if 'error' not in resume_data:
                    # Save resume to database
                    resume_db_data = {
                        'user_id': user_id,
                        'filename': file.filename,
                        'file_type': file.content_type,
                        'file_size': len(content),
                        'name': resume_data.get('name'),
                        'email': resume_data.get('email'),
                        'phone': resume_data.get('phone'),
                        'skills': resume_data.get('skills', []),
                        'experience': resume_data.get('experience'),
                        'education': resume_data.get('education'),
                        'raw_text': resume_data.get('raw_text'),
                        'parsed_data': resume_data
                    }
                    saved_resume = db_service.save_resume(resume_db_data)
                    resume_id = saved_resume['id']
                    
                    # Match resume
                    match_result = matcher.match(resume_data, required_skills)
                    
                    # Save match result to database
                    match_db_data = {
                        'user_id': user_id,
                        'job_search_id': job_search_id,
                        'resume_id': resume_id,
                        'match_score': match_result['score'],
                        'matched_skills': match_result['matched_skills'],
                        'missing_skills': [s for s in required_skills if s not in match_result['matched_skills']]
                    }
                    db_service.save_match_result(match_db_data)
                    
                    candidates.append({
                        "filename": file.filename,
                        "score": match_result['score'],
                        "matched_skills": match_result['matched_skills'],
                        "extracted_data": resume_data
                    })
                else:
                    candidates.append({
                        "filename": file.filename,
                        "score": 0.0,
                        "matched_skills": [],
                        "extracted_data": resume_data
                    })
            except Exception as e:
                print(f"ERROR processing {file.filename}: {str(e)}")
                candidates.append({
                    "filename": file.filename,
                    "score": 0.0,
                    "matched_skills": [],
                    "extracted_data": {"error": str(e)}
                })
            
            os.remove(temp_path)
        
        # Sort by score
        candidates.sort(key=lambda x: x['score'], reverse=True)
        
        return candidates
    
    except Exception as e:
        # If database save fails, fallback to simple matching without saving
        print(f"⚠️  Database save failed, falling back to simple matching: {e}")
        try:
            return await match_resumes(job_input, files)
        except Exception as fallback_error:
            raise HTTPException(500, f"Matching failed: {str(fallback_error)}")


@app.get("/api/resumes")
async def get_resumes(
    authorization: str = Header(None),
    limit: int = 50,
    offset: int = 0
):
    """Get all resumes for the authenticated user"""
    try:
        user_id = get_user_id(authorization)
        resumes = db_service.get_user_resumes(user_id, limit, offset)
        return resumes  # Return array directly, not wrapped in object
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch resumes: {str(e)}")


@app.get("/api/resumes/{resume_id}")
async def get_resume(resume_id: str, authorization: str = Header(None)):
    """Get a specific resume by ID"""
    try:
        user_id = get_user_id(authorization)
        resume = db_service.get_resume_by_id(resume_id, user_id)
        if not resume:
            raise HTTPException(404, "Resume not found")
        return resume
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch resume: {str(e)}")


@app.delete("/api/resumes/{resume_id}")
async def delete_resume(resume_id: str, authorization: str = Header(None)):
    """Delete a resume"""
    try:
        user_id = get_user_id(authorization)
        success = db_service.delete_resume(resume_id, user_id)
        if not success:
            raise HTTPException(404, "Resume not found")
        return {"message": "Resume deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete resume: {str(e)}")


@app.get("/api/job-searches")
async def get_job_searches(
    authorization: str = Header(None),
    limit: int = 50,
    offset: int = 0
):
    """Get all job searches for the authenticated user"""
    try:
        user_id = get_user_id(authorization)
        searches = db_service.get_user_job_searches(user_id, limit, offset)
        return searches  # Return array directly, not wrapped in object
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch job searches: {str(e)}")


@app.get("/api/matches")
async def get_matches(
    authorization: str = Header(None),
    limit: int = 100,
    offset: int = 0
):
    """Get all match results for the authenticated user"""
    try:
        user_id = get_user_id(authorization)
        matches = db_service.get_user_matches(user_id, limit, offset)
        return matches  # Return array directly, not wrapped in object
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch matches: {str(e)}")


@app.get("/api/job-searches/{job_id}/matches")
async def get_job_matches(job_id: str, authorization: str = Header(None)):
    """Get all matches for a specific job search"""
    try:
        user_id = get_user_id(authorization)
        matches = db_service.get_job_matches(job_id, user_id)
        return {"matches": matches}
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch job matches: {str(e)}")


@app.get("/api/dashboard/stats")
async def get_dashboard_stats(authorization: str = Header(None)):
    """Get dashboard statistics for the authenticated user"""
    try:
        user_id = get_user_id(authorization)
        stats = db_service.get_dashboard_stats(user_id)
        return stats
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch dashboard stats: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

