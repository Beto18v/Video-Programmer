<?php

namespace App\Jobs;

use App\Models\Video;
use App\Services\YoutubeUploadService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UploadVideoToYoutube implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Video $video;

    /**
     * Create a new job instance.
     */
    public function __construct(Video $video)
    {
        $this->video = $video;
    }

    /**
     * Execute the job.
     */
    public function handle(YoutubeUploadService $youtubeService): void
    {
        try {
            Log::info('Starting YouTube upload job', [
                'video_id' => $this->video->id,
                'title' => $this->video->title,
            ]);

            // Check if video still exists and is in correct state
            $video = Video::find($this->video->id);
            if (!$video) {
                Log::error('Video not found for upload job', ['video_id' => $this->video->id]);
                return;
            }

            if ($video->status !== 'pending' && $video->status !== 'scheduled') {
                Log::info('Video not in uploadable state', [
                    'video_id' => $video->id,
                    'status' => $video->status,
                ]);
                return;
            }

            // Check if upload should happen now or is scheduled for later
            if ($video->scheduled_for && $video->scheduled_for > now()) {
                Log::info('Video upload scheduled for later', [
                    'video_id' => $video->id,
                    'scheduled_for' => $video->scheduled_for,
                ]);

                // Re-dispatch job for scheduled time
                UploadVideoToYoutube::dispatch($video)->delay($video->scheduled_for);
                return;
            }

            // Check if channel has valid YouTube credentials
            if (!$youtubeService->hasValidCredentials($video->channel)) {
                Log::warning('No valid YouTube credentials for channel', [
                    'video_id' => $video->id,
                    'channel_id' => $video->channel_id,
                ]);

                $video->update([
                    'status' => 'failed',
                    'upload_error' => 'No valid YouTube credentials found for channel',
                ]);
                return;
            }

            // Update status to uploading
            $video->update(['status' => 'uploading']);

            // Attempt YouTube upload
            $result = $youtubeService->uploadVideo($video);

            if ($result['success']) {
                Log::info('Video successfully uploaded to YouTube via job', [
                    'video_id' => $video->id,
                    'youtube_video_id' => $result['youtube_video_id'],
                ]);
            } else {
                Log::error('YouTube upload failed in job', [
                    'video_id' => $video->id,
                    'error' => $result['error'],
                ]);

                $video->update([
                    'status' => 'failed',
                    'upload_error' => $result['error'],
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Exception in YouTube upload job', [
                'video_id' => $this->video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Update video status
            if ($video = Video::find($this->video->id)) {
                $video->update([
                    'status' => 'failed',
                    'upload_error' => $e->getMessage(),
                ]);
            }

            // Re-throw to mark job as failed
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('YouTube upload job failed permanently', [
            'video_id' => $this->video->id,
            'error' => $exception->getMessage(),
        ]);

        // Update video status
        if ($video = Video::find($this->video->id)) {
            $video->update([
                'status' => 'failed',
                'upload_error' => 'Upload job failed: ' . $exception->getMessage(),
            ]);
        }
    }
}
