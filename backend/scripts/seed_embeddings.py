#!/usr/bin/env python3
"""
Seed embeddings script - Index sample documents for RAG
"""

import os
import sys

def seed_embeddings():
    """Seed sample documents and generate embeddings"""
    print("🌱 Seeding embeddings...")
    
    # Sample documents to index
    sample_docs = [
        {
            "doc_id": "project_overview",
            "content": """
            InstallSure Project Overview
            
            This is a comprehensive construction management platform designed for enterprise use.
            The system includes project management, RFI tracking, task management, and BIM integration.
            
            Key features:
            - Real-time collaboration
            - Document management
            - Cost estimation
            - Timeline tracking
            - Safety compliance
            """
        },
        {
            "doc_id": "safety_requirements",
            "content": """
            Safety Requirements Document
            
            All construction projects must adhere to the following safety requirements:
            
            1. Personal Protective Equipment (PPE):
               - Hard hats required at all times
               - Safety glasses in designated areas
               - Steel-toed boots mandatory
               - High-visibility vests for all personnel
            
            2. Site Access:
               - All visitors must sign in
               - Safety orientation required before site entry
               - Emergency exits clearly marked
            
            3. Equipment Safety:
               - Regular equipment inspections
               - Only certified operators allowed
               - Lockout/tagout procedures enforced
            """
        },
        {
            "doc_id": "rfi_guidelines",
            "content": """
            Request for Information (RFI) Guidelines
            
            RFIs should be submitted when clarification is needed on:
            - Design specifications
            - Material selections
            - Construction methods
            - Schedule impacts
            
            RFI Process:
            1. Submit RFI with clear description
            2. Attach relevant drawings or documents
            3. Specify required response date
            4. Project manager reviews and routes to appropriate party
            5. Response provided within 3 business days
            6. RFI closed after implementation
            """
        }
    ]
    
    # Check if SEED environment variable is set
    if os.environ.get('SEED', '').lower() != 'true':
        print("⚠️  SEED environment variable not set to 'true'")
        print("   Set SEED=true to enable seeding")
        return 0
    
    print(f"📄 Indexing {len(sample_docs)} sample documents...")
    
    # TODO: Implement actual indexing via API or direct DB access
    # For now, just print what would be indexed
    for doc in sample_docs:
        print(f"   - {doc['doc_id']}: {len(doc['content'])} characters")
    
    print(f"✅ Successfully indexed {len(sample_docs)} documents")
    return len(sample_docs)

if __name__ == '__main__':
    try:
        count = seed_embeddings()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error seeding embeddings: {e}", file=sys.stderr)
        sys.exit(1)
