#!/usr/bin/env python3
"""
Utils module for video watermark removal.
Provides utilities for frame extraction, video reassembly, and common operations.
"""

import os
import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def extract_frames(video_path: str, output_dir: str, fps: int = 1) -> List[str]:
    """
    Extract frames from video at specified fps.

    Args:
        video_path: Path to input video
        output_dir: Directory to save frames
        fps: Frames per second to extract

    Returns:
        List of frame file paths
    """
    try:
        os.makedirs(output_dir, exist_ok=True)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(video_fps / fps) if fps > 0 else 1

        frame_paths = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                frame_path = os.path.join(output_dir, f"frame_{frame_count:06d}.png")
                cv2.imwrite(frame_path, frame)
                frame_paths.append(frame_path)

            frame_count += 1

        cap.release()
        logger.info(f"Extracted {len(frame_paths)} frames from {video_path}")
        return frame_paths

    except Exception as e:
        logger.error(f"Error extracting frames: {e}")
        raise

def reassemble_video(frame_paths: List[str], output_path: str, original_video_path: str) -> None:
    """
    Reassemble frames into video, preserving audio from original.

    Args:
        frame_paths: List of frame image paths
        output_path: Output video path
        original_video_path: Original video for audio extraction
    """
    try:
        if not frame_paths:
            raise ValueError("No frames to reassemble")

        # Read first frame to get dimensions
        first_frame = cv2.imread(frame_paths[0])
        height, width = first_frame.shape[:2]

        # Get original video properties
        cap = cv2.VideoCapture(original_video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        cap.release()

        # Create video writer
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        for frame_path in sorted(frame_paths):
            frame = cv2.imread(frame_path)
            out.write(frame)

        out.release()

        # Copy audio using ffmpeg if available
        try:
            import subprocess
            temp_video = output_path + '.temp.mp4'
            os.rename(output_path, temp_video)

            cmd = [
                'ffmpeg', '-i', temp_video, '-i', original_video_path,
                '-c', 'copy', '-map', '0:v:0', '-map', '1:a:0', '-shortest', output_path
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                os.remove(temp_video)
                logger.info(f"Audio preserved in {output_path}")
            else:
                logger.warning("Could not preserve audio, using video without audio")
                os.rename(temp_video, output_path)

        except ImportError:
            logger.warning("ffmpeg not available, video created without audio")

        logger.info(f"Video reassembled: {output_path}")

    except Exception as e:
        logger.error(f"Error reassembling video: {e}")
        raise

def get_video_info(video_path: str) -> dict:
    """
    Get basic video information.

    Args:
        video_path: Path to video file

    Returns:
        Dict with video properties
    """
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        info = {
            'fps': cap.get(cv2.CAP_PROP_FPS),
            'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'duration': cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
        }

        cap.release()
        return info

    except Exception as e:
        logger.error(f"Error getting video info: {e}")
        raise

def cleanup_temp_files(temp_dir: str) -> None:
    """
    Clean up temporary files and directories.

    Args:
        temp_dir: Directory to clean
    """
    try:
        import shutil
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            logger.info(f"Cleaned up temp directory: {temp_dir}")
    except Exception as e:
        logger.warning(f"Could not cleanup temp directory: {e}")

def validate_video_file(video_path: str) -> None:
    """
    Validate that video file exists and is readable.

    Args:
        video_path: Path to video file
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    if not os.access(video_path, os.R_OK):
        raise PermissionError(f"Cannot read video file: {video_path}")

    # Try to open with OpenCV
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        cap.release()
        raise ValueError(f"Invalid or corrupted video file: {video_path}")
    cap.release()