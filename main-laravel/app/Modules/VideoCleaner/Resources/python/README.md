# Video Watermark Removal Tool

A modular Python tool for removing dynamic watermarks from Sora-generated videos using computer vision techniques.

## Features

- **Dynamic Watermark Detection**: Supports watermarks in multiple positions (top/bottom, left/right, center)
- **Multiple Detection Methods**:
    - Template Matching (requires template image)
    - OCR-based detection (Tesseract)
    - Edge detection fallback
- **Advanced Cleaning**: OpenCV inpainting (TELEA/NS methods)
- **Batch Processing**: Process multiple videos simultaneously
- **Audio Preservation**: Maintains original audio track
- **Configurable Parameters**: FPS extraction, inpainting radius, etc.

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Install Tesseract OCR (for OCR detection):
    - Windows: Download from [GitHub releases](https://github.com/UB-Mannheim/tesseract/wiki)
    - Linux: `sudo apt-get install tesseract-ocr`
    - macOS: `brew install tesseract`

## Usage

### Single Video Processing

```bash
python remove_watermark.py \
  --input /path/to/video.mp4 \
  --output /path/to/output_clean.mp4 \
  --positions arriba-izquierda,medio-derecha \
  --extraction-fps 1 \
  --inpaint-method telea \
  --inpaint-radius 3
```

### Batch Processing

```bash
python remove_watermark.py \
  --input /path/to/video1.mp4,/path/to/video2.mp4 \
  --output /path/to/output_directory \
  --positions arriba-izquierda,abajo-derecha \
  --batch
```

### With Template Matching

```bash
python remove_watermark.py \
  --input video.mp4 \
  --output video_clean.mp4 \
  --positions arriba-izquierda \
  --template /path/to/watermark_template.png
```

## Parameters

- `--input`: Input video path(s) - single file or comma-separated for batch
- `--output`: Output path - file for single, directory for batch
- `--positions`: Comma-separated positions (required)
    - `arriba-izquierda`, `arriba-derecha`
    - `medio-izquierda`, `medio-derecha`
    - `abajo-izquierda`, `abajo-derecha`
- `--template`: Path to watermark template image (optional)
- `--no-ocr`: Disable OCR fallback detection
- `--extraction-fps`: Frames per second to extract (default: 1)
- `--inpaint-method`: Inpainting algorithm - 'telea' or 'ns' (default: telea)
- `--inpaint-radius`: Inpainting radius in pixels (default: 3)
- `--batch`: Enable batch processing mode

## Architecture

### Modules

- **`utils.py`**: Utility functions for frame extraction, video reassembly, validation
- **`detect.py`**: WatermarkDetector class with multiple detection strategies
- **`clean.py`**: VideoCleaner class for inpainting and frame processing
- **`remove_watermark.py`**: Main orchestrator script

### Pipeline

1. **Frame Extraction**: Extract frames at specified FPS
2. **Detection**: For each frame, detect watermark using:
    - Template matching (if template provided)
    - OCR detection (if enabled)
    - Edge detection (fallback)
3. **Cleaning**: Apply inpainting to detected regions
4. **Reassembly**: Combine cleaned frames into video with preserved audio

## Error Handling

- Comprehensive logging with timestamps
- Graceful degradation (e.g., skip frames that can't be processed)
- Temporary file cleanup
- Detailed error messages for debugging

## Performance Considerations

- Adjust `--extraction-fps` based on video length and hardware
- Use SSD storage for temporary files
- Consider GPU acceleration for large videos (requires OpenCV CUDA)
- Batch processing distributes load across videos

## Troubleshooting

### Common Issues

1. **Tesseract not found**: Install Tesseract and ensure it's in PATH
2. **OpenCV errors**: Ensure compatible OpenCV version
3. **Memory issues**: Reduce extraction FPS or process shorter segments
4. **Audio not preserved**: Install ffmpeg and ensure it's accessible

### Logs

Check console output for detailed progress and error information. The script logs:

- Frame processing progress
- Detection results
- Cleaning operations
- File operations

## Integration

This tool is designed to be called from external systems (e.g., Laravel Jobs). It returns appropriate exit codes:

- 0: Success
- 1: Error

Example Laravel integration:

```php
$process = new Process([
    'python3', $scriptPath,
    '--input', $inputPath,
    '--output', $outputPath,
    '--positions', implode(',', $positions)
]);
```

## Performance Optimizations

This tool includes several performance optimizations for production use:

### Detection Optimizations

- **Interval-based Detection**: Detect watermarks every N frames (default: 30) instead of every frame
- **Result Caching**: Reuse detection results across frames to avoid redundant processing
- **Multi-method Detection**: Template matching → OCR → Edge detection fallback

### Processing Optimizations

- **Frame Sampling**: Extract frames at configurable FPS (default: 1 FPS)
- **Mask Caching**: Reuse generated inpainting masks for identical regions
- **Adaptive Cleaning**: Apply cached detections to all frames automatically

### Resource Management

- **Memory Limits**: Configurable memory usage caps
- **Parallel Processing**: Support for multiprocessing (see `parallel.py`)
- **Temporary File Cleanup**: Automatic cleanup of intermediate files

### Configuration

Adjust performance settings in `config.ini`:

```ini
[processing]
extraction_fps = 1          # Lower = faster processing
detection_interval = 30     # Higher = faster detection
inpaint_radius = 3          # Smaller = faster inpainting
```

### Performance Metrics

Monitor these key metrics:

- **Processing Time**: < 5 minutes for 1-minute videos
- **Memory Usage**: < 2GB per video
- **Detection Accuracy**: > 95%
- **CPU Utilization**: < 80%

## Scaling Options

### Docker Deployment

```bash
docker build -t video-cleaner .
docker run -v /path/to/videos:/app/input video-cleaner --input input/video.mp4 --output output/clean.mp4
```

### Parallel Processing

```python
from parallel import ParallelProcessor

processor = ParallelProcessor(max_workers=4)
results = processor.process_batch_parallel(video_tasks)
```

See `PERFORMANCE_OPTIMIZATION.md` for detailed scaling strategies and future improvements.
