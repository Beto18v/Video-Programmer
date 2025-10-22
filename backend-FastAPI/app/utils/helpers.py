"""
Utility functions for video processing and YouTube publishing.

This module contains helper functions used across the application.
"""

def format_datetime(dt):
    """Format datetime object to ISO string."""
    return dt.isoformat()

def validate_video_file(file_path):
    """Validate if file is a supported video format."""
    import os
    valid_extensions = ['.mp4', '.avi', '.mov', '.mkv']
    _, ext = os.path.splitext(file_path)
    return ext.lower() in valid_extensions