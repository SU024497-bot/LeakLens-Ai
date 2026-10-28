# LeakLens AI Demo: Synthetic Leaked Source Code
import os

# Cloud Infrastructure Keys (Synthetic for testing)
AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7ABCD123'
AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY1'

# AI API Tokens
OPENAI_API_KEY = 'sk-proj-demoTestingKey1234567890abcdefghijklmnopqrstuvwxyz'
ANTHROPIC_API_KEY = 'sk-ant-api03-abcdef1234567890ghijklmnopqrstuvwxyz'

# Database URI
DATABASE_URL = 'postgres://admin_user:SuperSecretP@ssw0rd!@db.internal.local:5432/production_db'

def connect():
    print('Connecting with credentials...')
