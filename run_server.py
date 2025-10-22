#!/usr/bin/env python3
"""
Script to run the Video Programmer FastAPI server.
"""

import subprocess
import sys
import os

def main():
    """Run the FastAPI server."""
    # Change to the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Run uvicorn
    cmd = [
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8000"
    ]

    print("Starting Video Programmer FastAPI server...")
    print("OpenAPI docs available at: http://127.0.0.1:8000/docs")
    print("Health check at: http://127.0.0.1:8000/health")
    print("Press Ctrl+C to stop the server")

    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error starting server: {e}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())