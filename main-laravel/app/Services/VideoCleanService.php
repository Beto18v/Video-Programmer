<?php

namespace App\Services;

use App\Jobs\CleanSoraVideoJob;
use App\Models\VideoCleaner;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VideoCleanService
{
    public function processVideos(array $files, array $watermarkPositions, ?string $batchId = null): array
    {
        $results = [];

        foreach ($files as $file) {
            $result = $this->processSingleVideo($file, $watermarkPositions, $batchId);
            $results[] = $result;
        }

        return $results;
    }

    private function processSingleVideo(UploadedFile $file, array $watermarkPositions, ?string $batchId): array
    {
        // Validate input
        $this->validateVideoFile($file);

        // Generate paths
        $inputPath = $this->storeInputFile($file);
        $outputPath = $this->generateOutputPath($file->getClientOriginalName());

        // Create record
        $videoCleaner = VideoCleaner::create([
            'user_id' => auth()->id(),
            'original_filename' => $file->getClientOriginalName(),
            'input_path' => $inputPath,
            'output_path' => $outputPath,
            'status' => 'pending',
            'watermark_positions' => $watermarkPositions,
            'batch_id' => $batchId,
        ]);

        // Dispatch job
        CleanSoraVideoJob::dispatch($videoCleaner);

        return [
            'id' => $videoCleaner->id,
            'status' => 'pending',
            'message' => 'Video queued for processing',
        ];
    }

    private function validateVideoFile(UploadedFile $file): void
    {
        if (!$file->isValid()) {
            throw new \Exception('Invalid file upload');
        }

        if (!in_array($file->getMimeType(), ['video/mp4', 'video/avi', 'video/mov'])) {
            throw new \Exception('Unsupported video format. Only MP4, AVI, MOV allowed.');
        }

        if ($file->getSize() > 500 * 1024 * 1024) { // 500MB
            throw new \Exception('File too large. Maximum 500MB allowed.');
        }
    }

    private function storeInputFile(UploadedFile $file): string
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        return $file->storeAs('video-cleaner/inputs', $filename, 'local');
    }

    private function generateOutputPath(string $originalName): string
    {
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $cleanName = $baseName . '_clean.' . $extension;
        return 'video-cleaner/outputs/' . Str::uuid() . '_' . $cleanName;
    }

    public function getStatus(int $id): array
    {
        $videoCleaner = VideoCleaner::findOrFail($id);

        return [
            'id' => $videoCleaner->id,
            'status' => $videoCleaner->status,
            'progress' => $videoCleaner->progress,
            'error_message' => $videoCleaner->error_message,
            'download_url' => $videoCleaner->status === 'completed' ? Storage::url($videoCleaner->output_path) : null,
        ];
    }

    public function getBatchStatus(string $batchId): array
    {
        $videos = VideoCleaner::where('batch_id', $batchId)->get();

        return $videos->map(function ($video) {
            return $this->getStatus($video->id);
        })->toArray();
    }
}
