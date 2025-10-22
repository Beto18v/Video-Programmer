import json
import os
from pathlib import Path

def generate_credentials():
    """Generate credentials.json from .env variables."""
    # Load .env file
    env_path = Path('.env')
    if not env_path.exists():
        raise FileNotFoundError(".env file not found")
    
    env_vars = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    # Extract YouTube credentials
    client_id = env_vars.get('YT_CLIENT_ID')
    client_secret = env_vars.get('YT_CLIENT_SECRET')
    redirect_uri = env_vars.get('YT_REDIRECT_URI')
    
    if not all([client_id, client_secret, redirect_uri]):
        raise ValueError("Missing YT_CLIENT_ID, YT_CLIENT_SECRET, or YT_REDIRECT_URI in .env")
    
    # Create credentials.json structure
    credentials = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": ["http://localhost:8080"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "project_id": "video-programmer",  # Puedes cambiarlo si tienes un project_id específico
            "javascript_origins": ["http://localhost:8000", "http://127.0.0.1:8000"]
        }
    }
    
    # Write to credentials.json
    with open('credentials.json', 'w', encoding='utf-8') as f:
        json.dump(credentials, f, indent=2)
    
    print("credentials.json generated successfully!")

if __name__ == "__main__":
    generate_credentials()