"""
NLP Processor - Core NLP Pipeline
Implements all NLP concepts:
- Tokenization
- Lemmatization
- Stemming
- Stopword removal
- Text preprocessing
"""

import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer, PorterStemmer
from typing import List


class NLPProcessor:
    """
    Core NLP processing pipeline
    Simple, clean implementation of fundamental NLP concepts
    """
    
    def __init__(self):
        """Initialize NLP components and download required data"""
        # Download required NLTK data (run once)
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
        
        try:
            nltk.data.find('corpora/wordnet')
        except LookupError:
            nltk.download('wordnet')
        
        # Initialize tools
        self.lemmatizer = WordNetLemmatizer()
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
    
    def clean_text(self, text: str) -> str:
        """
        Clean and normalize text
        - Convert to lowercase
        - Remove special characters
        - Remove extra whitespace
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into words
        Concept: Breaking text into individual tokens
        """
        return word_tokenize(text)
    
    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """
        Remove common stopwords
        Concept: Filtering out words that don't carry much meaning
        """
        return [token for token in tokens if token.lower() not in self.stop_words]
    
    def lemmatize(self, tokens: List[str]) -> List[str]:
        """
        Lemmatize tokens to their root form
        Concept: Reducing words to their dictionary form
        Example: 'running' -> 'run', 'better' -> 'good'
        """
        return [self.lemmatizer.lemmatize(token) for token in tokens]
    
    def stem(self, tokens: List[str]) -> List[str]:
        """
        Stem tokens to their root form
        Concept: Reducing words to their stem
        Example: 'running' -> 'run', 'developer' -> 'develop'
        """
        return [self.stemmer.stem(token) for token in tokens]
    
    def process(self, text: str, use_lemmatization: bool = True) -> List[str]:
        """
        Complete NLP pipeline
        1. Clean text
        2. Tokenize
        3. Remove stopwords
        4. Lemmatize/Stem
        
        Args:
            text: Input text
            use_lemmatization: Use lemmatization (True) or stemming (False)
        
        Returns:
            Processed tokens
        """
        # Step 1: Clean
        cleaned = self.clean_text(text)
        
        # Step 2: Tokenize
        tokens = self.tokenize(cleaned)
        
        # Step 3: Remove stopwords
        filtered = self.remove_stopwords(tokens)
        
        # Step 4: Lemmatize or stem
        if use_lemmatization:
            processed = self.lemmatize(filtered)
        else:
            processed = self.stem(filtered)
        
        return processed
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """
        Extract important keywords from text
        Uses frequency-based approach
        """
        # Process text
        tokens = self.process(text)
        
        # Count frequency
        freq = {}
        for token in tokens:
            if len(token) > 2:  # Ignore very short words
                freq[token] = freq.get(token, 0) + 1
        
        # Sort by frequency
        sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        
        # Return top N keywords
        return [word for word, count in sorted_keywords[:top_n]]
