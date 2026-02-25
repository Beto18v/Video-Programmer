#!/usr/bin/env python3
"""
Main script for removing dynamic watermarks from Sora videos.
Orchestrates detection, cleaning, and video reassembly.
"""

import argparse
import sys
import tempfile
import os
from pathlib import Path
from typing import List, Optional
import logging

# Import our modules
from utils import extract_frames, reassemble_video, cleanup_temp_files, validate_video_file, get_video_info
from detect import WatermarkDetector
from clean import VideoCleaner, create_dynamic_mask, apply_adaptive_cleaning

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def parse_positions(positions_str: str) -> List[str]:
    """Parse comma-separated positions."""
    return [pos.strip() for pos in positions_str.split(',') if pos.strip()]

def process_single_video(input_path: str, output_path: str, positions: List[str],
                        template_path: Optional[str] = None, use_ocr: bool = True,
                        extraction_fps: int = 1, inpaint_method: str = 'telea',
                        inpaint_radius: int = 3, detection_interval: int = 30) -> None:
    """
    Process a single video for watermark removal.

    Args:
        input_path: Input video path
        output_path: Output video path
        positions: List of watermark positions
        template_path: Path to watermark template (optional)
        use_ocr: Whether to use OCR for detection
        extraction_fps: FPS for frame extraction
        inpaint_method: Inpainting method ('telea' or 'ns')
        inpaint_radius: Inpainting radius
    """
    temp_dir = None
    try:
        # Validate input
        validate_video_file(input_path)
        logger.info(f"Processing video: {input_path}")

        # Get video info
        video_info = get_video_info(input_path)
        logger.info(f"Video info: {video_info}")

        # Create temp directory
        temp_dir = tempfile.mkdtemp(prefix='watermark_removal_')

        # Extract frames
        frames_dir = os.path.join(temp_dir, 'frames')
        frame_paths = extract_frames(input_path, frames_dir, extraction_fps)

        if not frame_paths:
            raise ValueError("No frames extracted from video")

        # Initialize detector and cleaner
        detector = WatermarkDetector(template_path, use_ocr, detection_interval)
        cleaner = VideoCleaner(inpaint_method, inpaint_radius, adaptive_cleaning=True)

        # Detect watermarks in frames (optimized)
        watermark_bboxes = []
        for i, frame_path in enumerate(frame_paths):
            frame = cv2.imread(frame_path)
            if frame is None:
                watermark_bboxes.append(None)
                continue

            # Try to detect in each position (with caching)
            bbox = None
            for pos in positions:
                bbox = detector.detect_watermark(frame, pos, i)
                if bbox:
                    break

            watermark_bboxes.append(bbox)

            if (i + 1) % 50 == 0:
                logger.info(f"Processed detection for {i + 1}/{len(frame_paths)} frames")

        # Clean frames with adaptive cleaning
        cleaned_frames_dir = os.path.join(temp_dir, 'cleaned_frames')
        cleaned_paths = cleaner.clean_frames_batch(frame_paths, watermark_bboxes, cleaned_frames_dir, detector)

        # Reassemble video
        reassemble_video(cleaned_paths, output_path, input_path)

        logger.info(f"Successfully processed video: {output_path}")

    except Exception as e:
        logger.error(f"Error processing video {input_path}: {e}")
        raise
    finally:
        if temp_dir:
            cleanup_temp_files(temp_dir)

def process_batch(videos: List[str], output_dir: str, positions: List[str], **kwargs) -> None:
    """
    Process multiple videos in batch.

    Args:
        videos: List of input video paths
        output_dir: Output directory
        positions: Watermark positions
        **kwargs: Additional processing parameters
    """
    os.makedirs(output_dir, exist_ok=True)

    for video_path in videos:
        try:
            video_name = Path(video_path).stem
            output_path = os.path.join(output_dir, f"{video_name}_clean.mp4")

            logger.info(f"Processing batch video: {video_path}")
            process_single_video(video_path, output_path, positions, **kwargs)

        except Exception as e:
            logger.error(f"Failed to process {video_path}: {e}")
            continue

    logger.info("Batch processing completed")

def main():
    parser = argparse.ArgumentParser(description='Remove dynamic watermarks from Sora videos')
    parser.add_argument('--input', required=True, help='Input video path (or comma-separated for batch)')
    parser.add_argument('--output', required=True, help='Output video path (or directory for batch)')
    parser.add_argument('--positions', required=True, help='Comma-separated watermark positions')
    parser.add_argument('--template', help='Path to watermark template image')
    parser.add_argument('--no-ocr', action='store_true', help='Disable OCR fallback')
    parser.add_argument('--extraction-fps', type=int, default=1, help='FPS for frame extraction (default: 1)')
    parser.add_argument('--inpaint-method', choices=['telea', 'ns'], default='telea', help='Inpainting method')
    parser.add_argument('--inpaint-radius', type=int, default=3, help='Inpainting radius')
    parser.add_argument('--detection-interval', type=int, default=30, help='Detect watermark every N frames (default: 30)')
    parser.add_argument('--batch', action='store_true', help='Process as batch')

    args = parser.parse_args()

    try:
        positions = parse_positions(args.positions)
        if not positions:
            raise ValueError("No valid positions specified")

        # Validate positions
        valid_positions = ['arriba-izquierda', 'arriba-derecha', 'medio-izquierda',
                          'medio-derecha', 'abajo-izquierda', 'abajo-derecha']
        for pos in positions:
            if pos not in valid_positions:
                raise ValueError(f"Invalid position: {pos}")

        use_ocr = not args.no_ocr

        if args.batch:
            # Batch processing
            input_videos = [v.strip() for v in args.input.split(',') if v.strip()]
            process_batch(input_videos, args.output, positions,
                         template_path=args.template, use_ocr=use_ocr,
                         extraction_fps=args.extraction_fps,
                         inpaint_method=args.inpaint_method,
                         inpaint_radius=args.inpaint_radius,
                         detection_interval=args.detection_interval)
        else:
            # Single video processing
            process_single_video(args.input, args.output, positions,
                               template_path=args.template, use_ocr=use_ocr,
                               extraction_fps=args.extraction_fps,
                               inpaint_method=args.inpaint_method,
                               inpaint_radius=args.inpaint_radius,
                               detection_interval=args.detection_interval)

    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()