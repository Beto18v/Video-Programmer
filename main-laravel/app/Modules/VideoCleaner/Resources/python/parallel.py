#!/usr/bin/env python3
"""
Parallel processing utilities for video watermark removal.
Provides multiprocessing support for batch operations.
"""

import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor, as_completed
import os
import logging
from typing import List, Dict, Any
import psutil
import time

logger = logging.getLogger(__name__)

class ParallelProcessor:
    """Handles parallel processing of video cleaning tasks."""

    def __init__(self, max_workers: int = None):
        """
        Initialize parallel processor.

        Args:
            max_workers: Maximum number of worker processes
        """
        if max_workers is None:
            # Use 75% of available CPU cores
            max_workers = max(1, int(mp.cpu_count() * 0.75))

        self.max_workers = max_workers
        self.executor = ProcessPoolExecutor(max_workers=max_workers)
        logger.info(f"Initialized parallel processor with {max_workers} workers")

    def process_batch_parallel(self, video_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process multiple videos in parallel.

        Args:
            video_tasks: List of task dictionaries with video processing parameters

        Returns:
            List of results
        """
        results = []

        try:
            # Submit all tasks
            future_to_task = {}
            for task in video_tasks:
                future = self.executor.submit(self._process_single_task, task)
                future_to_task[future] = task

            # Collect results as they complete
            for future in as_completed(future_to_task):
                task = future_to_task[future]
                try:
                    result = future.result()
                    results.append(result)
                    logger.info(f"Completed task: {task.get('input_path', 'unknown')}")
                except Exception as e:
                    logger.error(f"Task failed: {task.get('input_path', 'unknown')} - {e}")
                    results.append({
                        'input_path': task.get('input_path'),
                        'success': False,
                        'error': str(e)
                    })

        except Exception as e:
            logger.error(f"Parallel processing failed: {e}")

        return results

    def _process_single_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single video task (runs in separate process).

        Args:
            task: Task parameters

        Returns:
            Processing result
        """
        try:
            # Import here to avoid issues with multiprocessing
            from remove_watermark import process_single_video

            start_time = time.time()

            process_single_video(
                input_path=task['input_path'],
                output_path=task['output_path'],
                positions=task['positions'],
                template_path=task.get('template_path'),
                use_ocr=task.get('use_ocr', True),
                extraction_fps=task.get('extraction_fps', 1),
                inpaint_method=task.get('inpaint_method', 'telea'),
                inpaint_radius=task.get('inpaint_radius', 3),
                detection_interval=task.get('detection_interval', 30)
            )

            processing_time = time.time() - start_time

            return {
                'input_path': task['input_path'],
                'output_path': task['output_path'],
                'success': True,
                'processing_time': processing_time,
                'memory_usage': self._get_memory_usage()
            }

        except Exception as e:
            return {
                'input_path': task['input_path'],
                'success': False,
                'error': str(e)
            }

    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        try:
            process = psutil.Process(os.getpid())
            return process.memory_info().rss / 1024 / 1024  # MB
        except:
            return 0.0

    def shutdown(self):
        """Shutdown the processor."""
        self.executor.shutdown(wait=True)
        logger.info("Parallel processor shutdown")

def optimize_for_hardware() -> Dict[str, Any]:
    """
    Get optimal settings based on available hardware.

    Returns:
        Dictionary with optimized parameters
    """
    cpu_count = mp.cpu_count()
    memory_gb = psutil.virtual_memory().total / (1024 ** 3)

    # Optimize based on hardware
    if memory_gb < 8:
        # Low memory system
        extraction_fps = 0.5
        detection_interval = 60
        max_workers = max(1, cpu_count // 2)
    elif memory_gb < 16:
        # Medium memory system
        extraction_fps = 1
        detection_interval = 30
        max_workers = max(1, int(cpu_count * 0.75))
    else:
        # High memory system
        extraction_fps = 2
        detection_interval = 15
        max_workers = cpu_count

    return {
        'extraction_fps': extraction_fps,
        'detection_interval': detection_interval,
        'max_workers': max_workers,
        'cpu_count': cpu_count,
        'memory_gb': memory_gb
    }

# Example usage
if __name__ == '__main__':
    # Auto-optimize for current hardware
    hardware_config = optimize_for_hardware()
    print(f"Hardware optimization: {hardware_config}")

    # Create processor
    processor = ParallelProcessor(hardware_config['max_workers'])

    # Example tasks
    tasks = [
        {
            'input_path': 'video1.mp4',
            'output_path': 'video1_clean.mp4',
            'positions': ['arriba-izquierda'],
            'extraction_fps': hardware_config['extraction_fps'],
            'detection_interval': hardware_config['detection_interval']
        }
    ]

    # Process in parallel
    results = processor.process_batch_parallel(tasks)
    print(f"Results: {results}")

    processor.shutdown()