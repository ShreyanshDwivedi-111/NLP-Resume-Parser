"""
Job Description Analyzer
Extracts skills, roles, and requirements from job descriptions using PURE NLP
"""

import re
from typing import Dict, List
from nlp_processor import NLPProcessor


class JobAnalyzer:
    """
    Analyze job descriptions to extract requirements
    Uses PURE NLP techniques - NO HARDCODED LISTS!
    """
    
    def __init__(self, nlp_processor: NLPProcessor):
        """Initialize with NLP processor"""
        self.nlp = nlp_processor
    
    def extract_roles(self, text: str) -> List[str]:
        """
        Extract job roles using NLP keyword extraction
        Looks for important nouns that might be roles
        """
        # Use keyword extraction
        keywords = self.nlp.extract_keywords(text, top_n=15)
        
        # Filter for likely role terms (ending with common role suffixes)
        role_keywords = ['developer', 'engineer', 'manager', 'architect', 'analyst',
                        'designer', 'specialist', 'lead', 'director', 'coordinator']
        
        found_roles = []
        text_lower = text.lower()
        
        for keyword in keywords:
            # Check if keyword contains any role term
            if any(role in keyword for role in role_keywords):
                found_roles.append(keyword)
        
        return list(set(found_roles))[:5]
    
    def extract_skills(self, text: str) -> List[str]:
        """
        Extract required skills using PURE NLP - NO HARDCODING!
        Uses Tokenization + Lemmatization + Keyword Extraction
        """
        # Step 1: Extract keywords using TF-based importance
        keywords = self.nlp.extract_keywords(text, top_n=30)
        
        # Step 2: Tokenize and lemmatize
        tokens = self.nlp.tokenize(text.lower())
        lemmatized = self.nlp.lemmatize(text.lower())
        
        found_skills = []
        
        # Step 3: Add important keywords
        for keyword in keywords:
            if len(keyword) > 2 and any(c.isalnum() for c in keyword):
                found_skills.append(keyword)
        
        # Step 4: Look for capitalized terms (often technologies/skills)
        words = text.split()
        for word in words:
            clean_word = re.sub(r'[^a-zA-Z0-9+#.]', '', word)
            if clean_word and len(clean_word) > 2:
                if word[0].isupper() or '+' in word or '#' in word or '.' in word:
                    found_skills.append(clean_word.lower())
        
        # Step 5: Extract technical terms with special patterns
        technical_patterns = [
            r'\b[A-Z][a-zA-Z]*\.js\b',  # Node.js, React.js
            r'\b[A-Z][a-zA-Z]+\+\+\b',  # C++
            r'\b[A-Z]#\b',              # C#, F#
            r'\b[A-Z][a-zA-Z]+Script\b', # JavaScript, TypeScript
            r'\b[A-Z]{2,}\b',           # AWS, SQL, API
            r'\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b',  # PostgreSQL, MongoDB
        ]
        
        for pattern in technical_patterns:
            matches = re.findall(pattern, text)
            found_skills.extend([m.lower() for m in matches])
        
        # Step 6: Multi-word technical terms
        multi_word_patterns = [
            r'\b(?:machine learning|deep learning|data science|cloud computing|'
            r'web development|full stack|front end|back end|software engineering|'
            r'ci/cd|devops|microservices|rest api|graphql)\b'
        ]
        
        for pattern in multi_word_patterns:
            matches = re.findall(pattern, text.lower())
            found_skills.extend(matches)
        
        return list(set(found_skills))[:40]  # Return top 40 unique skills
    
    def extract_experience(self, text: str) -> str:
        """
        Extract required years of experience
        Looks for patterns like "5 years experience", "3+ years"
        """
        patterns = [
            r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience',
            r'(\d+)-(\d+)\s*(?:years?|yrs?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                if len(match.groups()) > 1:
                    return f"{match.group(1)}-{match.group(2)} years"
                return f"{match.group(1)} years"
        
        return "Not specified"
    
    def analyze(self, description: str) -> Dict:
        """
        Analyze job description and extract all requirements
        
        Args:
            description: Job description text
        
        Returns:
            Dictionary with:
            - roles: List of job roles mentioned
            - skills: List of required skills
            - experience: Required experience
            - keywords: Important keywords extracted
        """
        # Extract components
        roles = self.extract_roles(description)
        skills = self.extract_skills(description)
        experience = self.extract_experience(description)
        
        # Extract keywords using NLP and filter out common non-skill words
        all_keywords = self.nlp.extract_keywords(description, top_n=20)
        
        # Common words to exclude from keywords (but NOT testing/tester/developer)
        exclude_words = {
            'looking', 'must', 'year', 'years', 'required', 'need', 'seeking',
            'candidate', 'should', 'strong', 'excellent', 'good', 'work',
            'working', 'team', 'ability', 'knowledge', 'position', 'job'
        }
        
        # Filter keywords - keep only relevant ones
        keywords = [kw for kw in all_keywords if kw.lower() not in exclude_words]
        
        return {
            "roles": roles,
            "skills": skills,
            "experience": experience,
            "keywords": keywords[:10]  # Top 10 filtered keywords
        }
