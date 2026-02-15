"""
Database service for Supabase operations
"""
import os
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from models import ResumeDB, JobSearchDB, MatchResultDB

class DatabaseService:
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for backend
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment")
        
        self.client: Client = create_client(supabase_url, supabase_key)
    
    # ==================== RESUMES ====================
    
    def save_resume(self, resume_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a resume to database"""
        try:
            response = self.client.table('resumes').insert(resume_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error saving resume: {e}")
            raise
    
    def get_user_resumes(self, user_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all resumes for a user"""
        try:
            response = self.client.table('resumes')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching resumes: {e}")
            return []
    
    def get_resume_by_id(self, resume_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific resume by ID"""
        try:
            response = self.client.table('resumes')\
                .select('*')\
                .eq('id', resume_id)\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching resume: {e}")
            return None
    
    def delete_resume(self, resume_id: str, user_id: str) -> bool:
        """Delete a resume"""
        try:
            self.client.table('resumes')\
                .delete()\
                .eq('id', resume_id)\
                .eq('user_id', user_id)\
                .execute()
            return True
        except Exception as e:
            print(f"Error deleting resume: {e}")
            return False
    
    def search_resumes(self, user_id: str, query: str) -> List[Dict[str, Any]]:
        """Search resumes by name, email, or skills"""
        try:
            # Use ilike for case-insensitive search
            response = self.client.table('resumes')\
                .select('*')\
                .eq('user_id', user_id)\
                .or_(f"name.ilike.%{query}%,email.ilike.%{query}%")\
                .order('created_at', desc=True)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error searching resumes: {e}")
            return []
    
    # ==================== JOB SEARCHES ====================
    
    def save_job_search(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a job search to database"""
        try:
            response = self.client.table('job_searches').insert(job_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error saving job search: {e}")
            raise
    
    def get_user_job_searches(self, user_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all job searches for a user"""
        try:
            response = self.client.table('job_searches')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching job searches: {e}")
            return []
    
    def get_job_search_by_id(self, job_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific job search by ID"""
        try:
            response = self.client.table('job_searches')\
                .select('*')\
                .eq('id', job_id)\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching job search: {e}")
            return None
    
    # ==================== MATCH RESULTS ====================
    
    def save_match_result(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a match result to database"""
        try:
            response = self.client.table('match_results').insert(match_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error saving match result: {e}")
            raise
    
    def get_job_matches(self, job_search_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get all match results for a job search"""
        try:
            response = self.client.table('match_results')\
                .select('*, resumes(*)')\
                .eq('job_search_id', job_search_id)\
                .eq('user_id', user_id)\
                .order('match_score', desc=True)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching match results: {e}")
            return []
    
    def get_user_matches(self, user_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all match results for a user"""
        try:
            response = self.client.table('match_results')\
                .select('*, resumes(filename, name), job_searches(job_title)')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching user matches: {e}")
            return []
    
    # ==================== STATISTICS ====================
    
    def get_dashboard_stats(self, user_id: str) -> Dict[str, Any]:
        """Get dashboard statistics for a user"""
        try:
            # Count total resumes
            resumes_count = self.client.table('resumes')\
                .select('id', count='exact')\
                .eq('user_id', user_id)\
                .execute()
            
            # Count total job searches
            jobs_count = self.client.table('job_searches')\
                .select('id', count='exact')\
                .eq('user_id', user_id)\
                .execute()
            
            # Count total matches and get average score
            matches = self.client.table('match_results')\
                .select('match_score')\
                .eq('user_id', user_id)\
                .execute()
            
            total_matches = len(matches.data) if matches.data else 0
            avg_score = sum(m['match_score'] for m in matches.data) / total_matches if total_matches > 0 else 0
            
            # Get recent activity
            recent = self.client.table('match_results')\
                .select('*, resumes(filename, name), job_searches(job_title)')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .limit(10)\
                .execute()
            
            return {
                'total_resumes': resumes_count.count or 0,
                'total_job_searches': jobs_count.count or 0,
                'total_matches': total_matches,
                'avg_match_score': round(avg_score, 2) if avg_score else 0,
                'recent_activity': recent.data or []
            }
        except Exception as e:
            print(f"Error fetching dashboard stats: {e}")
            return {
                'total_resumes': 0,
                'total_job_searches': 0,
                'total_matches': 0,
                'avg_match_score': 0,
                'recent_activity': []
            }
