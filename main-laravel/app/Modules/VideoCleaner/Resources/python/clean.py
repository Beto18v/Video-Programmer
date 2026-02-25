#!/usr/bin/env python3
"""
Cleaning module for watermark removal.
Applies inpainting and frame processing.
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

class VideoCleaner:
    """Class for cleaning watermarks from video frames."""

    def __init__(self, inpaint_method: str = 'telea', inpaint_radius: int = 3,
                 adaptive_cleaning: bool = True):
        """
        Initialize cleaner.

        Args:
            inpaint_method: 'telea' or 'ns'
            inpaint_radius: Radius for inpainting
            adaptive_cleaning: Whether to use adaptive mask generation
        """
        self.inpaint_method = cv2.INPAINT_TELEA if inpaint_method.lower() == 'telea' else cv2.INPAINT_NS
        self.inpaint_radius = inpaint_radius
        self.adaptive_cleaning = adaptive_cleaning
        self.mask_cache = {}  # Cache generated masks
        logger.info(f"Initialized cleaner with {inpaint_method} method, radius {inpaint_radius}")

    def clean_frame(self, frame: np.ndarray, watermark_bbox: Tuple[int, int, int, int]) -> np.ndarray:
        """
        Clean watermark from a single frame.

        Args:
            frame: Input frame
            watermark_bbox: Bounding box (x1, y1, x2, y2)

        Returns:
            Cleaned frame
        """
        try:
            x1, y1, x2, y2 = watermark_bbox

            # Ensure coordinates are within frame bounds
            height, width = frame.shape[:2]
            x1, x2 = max(0, x1), min(width, x2)
            y1, y2 = max(0, y1), min(height, y2)

            if x2 <= x1 or y2 <= y1:
                logger.warning("Invalid bounding box, skipping cleaning")
                return frame

            # Create or reuse mask
            mask_key = f"{x1}_{y1}_{x2}_{y2}_{width}_{height}"
            if mask_key not in self.mask_cache:
                mask = np.zeros((height, width), dtype=np.uint8)
                mask[y1:y2, x1:x2] = 255
                self.mask_cache[mask_key] = mask
                logger.debug(f"Generated new mask for {mask_key}")

            mask = self.mask_cache[mask_key]

            # Apply inpainting
            cleaned = cv2.inpaint(frame, mask, self.inpaint_radius, self.inpaint_method)

            return cleaned

        except Exception as e:
            logger.error(f"Error cleaning frame: {e}")
            return frame

    def clean_frames_batch(self, frame_paths: List[str], watermark_bboxes: List[Optional[Tuple[int, int, int, int]]],
                          output_dir: str, detector: Optional['WatermarkDetector'] = None) -> List[str]:
        """
        Clean multiple frames in batch (optimized).

        Args:
            frame_paths: List of input frame paths
            watermark_bboxes: List of bounding boxes (one per frame, None if no watermark)
            output_dir: Output directory for cleaned frames
            detector: WatermarkDetector instance for adaptive cleaning

        Returns:
            List of cleaned frame paths
        """
        try:
            os.makedirs(output_dir, exist_ok=True)
            cleaned_paths = []

            for i, (frame_path, bbox) in enumerate(zip(frame_paths, watermark_bboxes)):
                frame = cv2.imread(frame_path)
                if frame is None:
                    logger.warning(f"Could not read frame {frame_path}, skipping")
                    continue

                if bbox:
                    cleaned_frame = self.clean_frame(frame, bbox)
                elif self.adaptive_cleaning and detector:
                    # Try adaptive cleaning based on cached detections
                    cleaned_frame = self._adaptive_clean_frame(frame, detector)
                else:
                    cleaned_frame = frame  # No watermark detected

                output_path = os.path.join(output_dir, f"cleaned_{i:06d}.png")
                cv2.imwrite(output_path, cleaned_frame)
                cleaned_paths.append(output_path)

                if (i + 1) % 100 == 0:
                    logger.info(f"Processed {i + 1}/{len(frame_paths)} frames")

            logger.info(f"Batch cleaning completed: {len(cleaned_paths)} frames")
            return cleaned_paths

        except Exception as e:
            logger.error(f"Error in batch cleaning: {e}")
            raise

    def _adaptive_clean_frame(self, frame: np.ndarray, detector: 'WatermarkDetector') -> np.ndarray:
        """
        Apply adaptive cleaning using detector's cached masks.

        Args:
            frame: Input frame
            detector: WatermarkDetector with cached detections

        Returns:
            Cleaned frame
        """
        try:
            cleaned_frame = frame.copy()
            height, width = frame.shape[:2]

            # Apply all cached masks
            for position, bbox in detector.detected_masks.items():
                if bbox:
                    x1, y1, x2, y2 = bbox
                    # Ensure coordinates are valid
                    x1, x2 = max(0, x1), min(width, x2)
                    y1, y2 = max(0, y1), min(height, y2)

                    if x2 > x1 and y2 > y1:
                        mask = np.zeros((height, width), dtype=np.uint8)
                        mask[y1:y2, x1:x2] = 255
                        cleaned_frame = cv2.inpaint(cleaned_frame, mask, self.inpaint_radius, self.inpaint_method)

            return cleaned_frame

        except Exception as e:
            logger.error(f"Error in adaptive cleaning: {e}")
            return frame

def create_dynamic_mask(frame: np.ndarray, positions: List[str]) -> np.ndarray:
    """
    Create a dynamic mask based on watermark positions.
    Useful when detection fails but positions are known.

    Args:
        frame: Input frame
        positions: List of position strings

    Returns:
        Mask array
    """
    height, width = frame.shape[:2]
    mask = np.zeros((height, width), dtype=np.uint8)

    regions = {
        'arriba-izquierda': (0, 0, width//4, height//4),
        'arriba-derecha': (3*width//4, 0, width, height//4),
        'medio-izquierda': (0, height//4, width//4, 3*height//4),
        'medio-derecha': (3*width//4, height//4, width, 3*height//4),
        'abajo-izquierda': (0, 3*height//4, width//4, height),
        'abajo-derecha': (3*width//4, 3*height//4, width, height),
    }

    for pos in positions:
        if pos in regions:
            x1, y1, x2, y2 = regions[pos]
            mask[y1:y2, x1:x2] = 255

    return mask

def apply_adaptive_cleaning(frame: np.ndarray, mask: np.ndarray,
                           method: str = 'telea', radius: int = 3) -> np.ndarray:
    """
    Apply adaptive cleaning based on mask.

    Args:
        frame: Input frame
        mask: Binary mask (255 where to clean)
        method: Inpainting method
        radius: Inpainting radius

    Returns:
        Cleaned frame
    """
    try:
        inpaint_flag = cv2.INPAINT_TELEA if method.lower() == 'telea' else cv2.INPAINT_NS
        cleaned = cv2.inpaint(frame, mask, radius, inpaint_flag)
        return cleaned
    except Exception as e:
        logger.error(f"Adaptive cleaning failed: {e}")
        return frame