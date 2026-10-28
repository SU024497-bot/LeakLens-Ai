# LeakLens AI Demo: Clean Source Code
import os

def calculate_metrics(values: list[float]) -> dict:
    total = sum(values)
    count = len(values)
    mean = total / count if count > 0 else 0.0
    return {'count': count, 'mean': mean}

# Load credentials securely from environment
API_KEY = os.environ.get('SERVICE_API_KEY')
