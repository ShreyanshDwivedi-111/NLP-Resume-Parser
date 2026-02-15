"""
Resume Matcher - Match resumes to job requirements
Uses Levenshtein distance for fuzzy skill matching
"""

from typing import Dict, List


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Calculate Levenshtein distance between two strings
    Simple implementation without external dependencies
    """
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            # Cost of insertions, deletions, or substitutions
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]


class ResumeMatcher:
    """
    Match resumes against job requirements
    Uses Levenshtein distance for similarity matching
    """
    
    def __init__(self, similarity_threshold: float = 0.60):
        """
        Initialize matcher
        
        Args:
            similarity_threshold: Minimum similarity score (0-1) to consider a match
                                 Lowered to 0.60 for fuzzy matching (tester~testing=57%)
                                 Lowered to 0.75 for better fuzzy matching
        """
        self.threshold = similarity_threshold
    
    def levenshtein_similarity(self, str1: str, str2: str) -> float:
        """
        Calculate similarity between two strings using Levenshtein distance
        
        Concept: Levenshtein distance measures the minimum number of 
        single-character edits needed to change one word into another
        
        Returns:
            Similarity score between 0 and 1 (1 = identical)
        """
        # Get Levenshtein distance using our implementation
        distance = levenshtein_distance(str1.lower(), str2.lower())
        
        # Convert to similarity score (0-1)
        max_len = max(len(str1), len(str2))
        if max_len == 0:
            return 1.0
        
        similarity = 1 - (distance / max_len)
        return similarity
    
    def fuzzy_match_skill(self, skill: str, skill_list: List[str]) -> tuple:
        """
        Check if a skill matches any skill in the list using fuzzy matching
        
        Args:
            skill: Skill to match
            skill_list: List of skills to match against
        
        Returns:
            (matched, best_match, similarity_score)
        """
        best_match = None
        best_score = 0
        
        for candidate_skill in skill_list:
            similarity = self.levenshtein_similarity(skill, candidate_skill)
            
            if similarity > best_score:
                best_score = similarity
                best_match = candidate_skill
        
        # Check if similarity meets threshold
        matched = best_score >= self.threshold
        
        return matched, best_match, best_score
    
    def match(self, resume_data: Dict, required_skills: List[str]) -> Dict:
        """
        Match a resume against required skills
        
        Args:
            resume_data: Parsed resume data (from ResumeParser)
            required_skills: List of required skills from job
        
        Returns:
            Dictionary with:
            - score: Overall match score (0-100)
            - matched_skills: List of matched skills
            - missing_skills: Skills not found in resume
            - match_details: Detailed matching information
        """
        if 'error' in resume_data:
            return {
                'score': 0,
                'matched_skills': [],
                'missing_skills': required_skills,
                'match_details': []
            }
        
        # Get resume skills and keywords
        resume_skills = resume_data.get('skills', [])
        resume_keywords = resume_data.get('keywords', [])
        all_resume_terms = resume_skills + resume_keywords
        
        # Match each required skill
        matched_skills = []
        missing_skills = []
        match_details = []
        
        for required_skill in required_skills:
            matched, best_match, similarity = self.fuzzy_match_skill(
                required_skill,
                all_resume_terms
            )
            
            if matched:
                matched_skills.append(required_skill)
                match_details.append({
                    'required': required_skill,
                    'found': best_match,
                    'similarity': round(similarity, 2)
                })
            else:
                missing_skills.append(required_skill)
        
        # Calculate overall score
        if len(required_skills) > 0:
            match_percentage = (len(matched_skills) / len(required_skills)) * 100
        else:
            match_percentage = 0
        
        return {
            'score': round(match_percentage, 2),
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'match_details': match_details
        }
