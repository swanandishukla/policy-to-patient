"""
Retrieval Service for Policy-to-Patient.
Implements lexical and term-matching passage retrieval over policy chunks,
preserving physical page numbers and section titles while calculating relevance scores.
"""

import re
from typing import List, Dict, Any, Tuple
import math


class PolicyRetriever:
    """Passage retrieval engine for extracted policy chunks."""

    # Common English stopwords to filter during lexical scoring
    STOPWORDS = {
        "a", "an", "the", "and", "or", "but", "about", "above", "after", "again", "against",
        "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been",
        "before", "being", "below", "between", "both", "by", "can't", "cannot", "could", "couldn't",
        "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each",
        "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't",
        "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
        "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in",
        "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most",
        "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
        "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
        "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than",
        "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
        "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
        "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd",
        "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
        "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
        "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your",
        "yours", "yourself", "yourselves", "tell", "show", "policy", "wording", "say", "does"
    }

    @classmethod
    def retrieve_relevant_chunks(
        cls,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Rank policy chunks by relevance to the query.
        Returns top_k chunks with calculated relevance_score (0.0 to 1.0).
        """
        if not query or not chunks:
            return []

        query_clean = re.sub(r'[^\w\s]', ' ', query.lower())
        tokens = [t for t in query_clean.split() if t not in cls.STOPWORDS and len(t) > 1]
        
        if not tokens:
            tokens = [t for t in query_clean.split() if len(t) > 1]

        scored_chunks = []

        for chunk in chunks:
            text = chunk.get("text", "")
            title = chunk.get("section_title", "")
            text_lower = text.lower()
            title_lower = title.lower()

            score = 0.0

            # Token term frequency scoring
            for token in tokens:
                # Count in body text
                tf = text_lower.count(token)
                if tf > 0:
                    score += (1.0 + math.log(tf)) * 1.5
                
                # Boost if token appears in section title
                if token in title_lower:
                    score += 3.0

            # Bigram exact match boost
            if len(tokens) >= 2:
                for j in range(len(tokens) - 1):
                    bigram = f"{tokens[j]} {tokens[j+1]}"
                    if bigram in text_lower:
                        score += 4.0
                    if bigram in title_lower:
                        score += 6.0

            # Standard generic policy words
            generic_vocab = {"coverage", "limit", "sublimit", "clause", "policy", "claim", "hospital", "insured", "benefit", "amount", "section", "details", "definition", "term", "condition", "period", "what", "is", "there"}
            specific_tokens = [t for t in tokens if t not in generic_vocab]

            # If user query contains specific terms (e.g., 'quantum', 'computing', 'hardware') but chunk contains none of them
            if specific_tokens:
                specific_matches = sum(1 for st in specific_tokens if st in text_lower or st in title_lower)
                if specific_matches == 0:
                    score = 0.0

            if score > 0:
                # Normalize score roughly between 0.1 and 1.0
                normalized_score = round(min(1.0, score / 15.0), 3)
                if normalized_score >= 0.20:
                    scored_chunks.append({
                        "chunk_id": chunk["chunk_id"],
                        "page_number": chunk["page_number"],
                        "section_title": chunk["section_title"],
                        "text": chunk["text"],
                        "relevance_score": normalized_score,
                        "raw_score": score
                    })

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x["raw_score"], reverse=True)

        return scored_chunks[:top_k]
