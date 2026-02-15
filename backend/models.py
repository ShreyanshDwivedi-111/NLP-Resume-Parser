"""
Database models for Resume Parser
Using Supabase PostgreSQL
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, UUID4

class ResumeDB(BaseModel):
    """Resume database model"""
    id: Optional[UUID4] = None
    user_id: UUID4
    filename: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    
    # Parsed data
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience: Optional[str] = None
    education: Optional[str] = None
    raw_text: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class JobSearchDB(BaseModel):
    """Job search database model"""
    id: Optional[UUID4] = None
    user_id: UUID4
    
    # Job details
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    keywords: List[str] = []
    use_keywords: bool = False
    
    # Extracted requirements
    required_skills: List[str] = []
    required_roles: List[str] = []
    required_experience: Optional[str] = None
    
    # Metadata
    created_at: Optional[datetime] = None

class MatchResultDB(BaseModel):
    """Match result database model"""
    id: Optional[UUID4] = None
    user_id: UUID4
    job_search_id: Optional[UUID4] = None
    resume_id: UUID4
    
    # Match details
    match_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    experience_match: Optional[bool] = None
    
    # Additional info
    notes: Optional[str] = None
    
    # Metadata
    created_at: Optional[datetime] = None

class ResumeResponse(BaseModel):
    """Response model for resume"""
    id: str
    filename: str
    name: Optional[str]
    email: Optional[str]
    skills: List[str]
    created_at: str
    match_score: Optional[float] = None

class JobSearchResponse(BaseModel):
    """Response model for job search"""
    id: str
    job_title: Optional[str]
    job_description: Optional[str]
    keywords: List[str]
    created_at: str
    total_matches: Optional[int] = None

class MatchResultResponse(BaseModel):
    """Response model for match result"""
    id: str
    resume_filename: str
    candidate_name: Optional[str]
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    created_at: str

class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_resumes: int
    total_job_searches: int
    total_matches: int
    avg_match_score: Optional[float] = None
    top_skills: List[Dict[str, Any]] = []
    recent_activity: List[Dict[str, Any]] = []
