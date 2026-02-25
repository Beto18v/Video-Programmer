#!/usr/bin/env python3
"""
Detection module for watermark identification.
Uses template matching and OCR fallback for dynamic watermark detection.
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict
import logging
import os

logger = logging.getLogger(__name__)

class WatermarkDetector:
    """Class for detecting watermarks in video frames."""

    def __init__(self, template_path: Optional[str] = None, use_ocr: bool = True,
                 detection_interval: int = 30):
        """
        Initialize detector.

        Args:
            template_path: Path to watermark template image (optional)
            use_ocr: Whether to use OCR as fallback
            detection_interval: Detect watermark every N frames (optimization)
        """
        self.template = None
        self.use_ocr = use_ocr
        self.detection_interval = detection_interval
        self.detected_masks = {}  # Cache detected masks per position
        self.last_detection_frame = {}  # Track last detection frame per position

        if template_path and os.path.exists(template_path):
            self.template = cv2.imread(template_path, cv2.IMREAD_GRAYSCALE)
            logger.info(f"Loaded template from {template_path}")

        if use_ocr:
            try:
                import pytesseract
                self.ocr_available = True
                logger.info("OCR (Tesseract) available for watermark detection")
            except ImportError:
                self.ocr_available = False
                logger.warning("OCR not available, install pytesseract for better detection")

    def should_detect(self, frame_number: int, position: str) -> bool:
        """
        Determine if detection should run for this frame and position.

        Args:
            frame_number: Current frame number
            position: Watermark position

        Returns:
            True if detection should run
        """
        last_frame = self.last_detection_frame.get(position, -self.detection_interval)
        return (frame_number - last_frame) >= self.detection_interval

    def get_cached_mask(self, position: str) -> Optional[Tuple[int, int, int, int]]:
        """
        Get cached detection result for position.

        Args:
            position: Watermark position

        Returns:
            Cached bounding box or None
        """
        return self.detected_masks.get(position)

    def update_cache(self, position: str, bbox: Optional[Tuple[int, int, int, int]], frame_number: int):
        """
        Update detection cache.

        Args:
            position: Watermark position
            bbox: Detected bounding box
            frame_number: Frame number when detected
        """
        if bbox:
            self.detected_masks[position] = bbox
            self.last_detection_frame[position] = frame_number
            logger.debug(f"Cached detection for {position}: {bbox}")

    def detect_watermark(self, frame: np.ndarray, position: str, frame_number: int = 0) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect watermark in frame at specified position (optimized).

        Args:
            frame: Input frame
            position: Position string (e.g., 'arriba-izquierda')
            frame_number: Current frame number for optimization

        Returns:
            Bounding box (x1, y1, x2, y2) or None if not found
        """
        # Check cache first
        if not self.should_detect(frame_number, position):
            return self.get_cached_mask(position)

        try:
            # Define search regions based on position
            height, width = frame.shape[:2]
            regions = self._get_position_regions(width, height)

            if position not in regions:
                logger.warning(f"Unknown position: {position}")
                return None

            x1, y1, x2, y2 = regions[position]
            roi = frame[y1:y2, x1:x2]

            # Try template matching first
            if self.template is not None:
                bbox = self._template_match(roi, x1, y1)
                if bbox:
                    self.update_cache(position, bbox, frame_number)
                    return bbox

            # Fallback to OCR
            if self.use_ocr and self.ocr_available:
                bbox = self._ocr_detect(roi, x1, y1)
                if bbox:
                    self.update_cache(position, bbox, frame_number)
                    return bbox

            # Fallback to simple edge detection
            bbox = self._edge_detect(roi, x1, y1)
            if bbox:
                self.update_cache(position, bbox, frame_number)
            return bbox

        except Exception as e:
            logger.error(f"Error detecting watermark: {e}")
            return None
        try:
            # Define search regions based on position
            height, width = frame.shape[:2]
            regions = self._get_position_regions(width, height)

            if position not in regions:
                logger.warning(f"Unknown position: {position}")
                return None

            x1, y1, x2, y2 = regions[position]
            roi = frame[y1:y2, x1:x2]

            # Try template matching first
            if self.template is not None:
                bbox = self._template_match(roi, x1, y1)
                if bbox:
                    return bbox

            # Fallback to OCR
            if self.use_ocr and self.ocr_available:
                bbox = self._ocr_detect(roi, x1, y1)
                if bbox:
                    return bbox

            # Fallback to simple edge detection
            bbox = self._edge_detect(roi, x1, y1)
            return bbox

        except Exception as e:
            logger.error(f"Error detecting watermark: {e}")
            return None

    def _get_position_regions(self, width: int, height: int) -> Dict[str, Tuple[int, int, int, int]]:
        """Get bounding boxes for watermark positions."""
        return {
            'arriba-izquierda': (0, 0, width//4, height//4),
            'arriba-derecha': (3*width//4, 0, width, height//4),
            'medio-izquierda': (0, height//4, width//4, 3*height//4),
            'medio-derecha': (3*width//4, height//4, width, 3*height//4),
            'abajo-izquierda': (0, 3*height//4, width//4, height),
            'abajo-derecha': (3*width//4, 3*height//4, width, height),
        }

    def _template_match(self, roi: np.ndarray, offset_x: int, offset_y: int) -> Optional[Tuple[int, int, int, int]]:
        """Template matching for watermark detection."""
        try:
            if self.template is None:
                return None

            # Convert to grayscale
            if len(roi.shape) == 3:
                roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            else:
                roi_gray = roi

            # Template matching
            result = cv2.matchTemplate(roi_gray, self.template, cv2.TM_CCOEFF_NORMED)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

            # Threshold for match
            if max_val > 0.7:  # Adjustable threshold
                h, w = self.template.shape
                x1, y1 = max_loc
                x2, y2 = x1 + w, y1 + h

                # Adjust for global coordinates
                return (offset_x + x1, offset_y + y1, offset_x + x2, offset_y + y2)

        except Exception as e:
            logger.error(f"Template matching failed: {e}")

        return None

    def _ocr_detect(self, roi: np.ndarray, offset_x: int, offset_y: int) -> Optional[Tuple[int, int, int, int]]:
        """OCR-based watermark detection."""
        try:
            import pytesseract
            from pytesseract import Output

            # Convert to grayscale
            if len(roi.shape) == 3:
                gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            else:
                gray = roi

            # Preprocessing
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

            # OCR
            data = pytesseract.image_to_data(thresh, output_type=Output.DICT)

            # Look for text boxes
            for i, text in enumerate(data['text']):
                if text.strip():  # Found text
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    conf = int(data['conf'][i])

                    if conf > 60:  # Confidence threshold
                        return (offset_x + x, offset_y + y, offset_x + x + w, offset_y + y + h)

        except Exception as e:
            logger.error(f"OCR detection failed: {e}")

        return None

    def _edge_detect(self, roi: np.ndarray, offset_x: int, offset_y: int) -> Optional[Tuple[int, int, int, int]]:
        """Simple edge detection for watermark regions."""
        try:
            # Convert to grayscale
            if len(roi.shape) == 3:
                gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            else:
                gray = roi

            # Edge detection
            edges = cv2.Canny(gray, 50, 150)

            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if contours:
                # Get largest contour as potential watermark
                largest = max(contours, key=cv2.contourArea)
                x, y, w, h = cv2.boundingRect(largest)

                # Filter by size (watermark should be reasonably sized)
                area = w * h
                roi_area = roi.shape[0] * roi.shape[1]

                if 0.05 < area / roi_area < 0.8:  # 5-80% of region
                    return (offset_x + x, offset_y + y, offset_x + x + w, offset_y + y + h)

        except Exception as e:
            logger.error(f"Edge detection failed: {e}")

        return None