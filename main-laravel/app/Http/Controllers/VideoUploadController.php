<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\VideoSchedule;
use App\Models\Channel;
use App\Services\YoutubeUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class VideoUploadController extends Controller
{
    protected YoutubeUploadService $youtubeService;

    public function __construct(YoutubeUploadService $youtubeService)
    {
        $this->youtubeService = $youtubeService;
    }
    /**
     * Upload multiple videos to a specific channel
     */
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'channel_id' => 'required|exists:channels,id',
            'videos' => 'required|array|min:1',
            'videos.*.title' => 'required|string|max:100|min:3',
            'videos.*.description' => 'nullable|string',
            'videos.*.hashtags' => 'nullable|string',
            'videos.*.scheduled_at' => 'required|date|after:now',
            'videos.*.for_kids' => 'boolean',
            'videos.*.age_restricted' => 'boolean',
            'videos.*.video_file' => 'required|file|mimes:mp4,avi,mov,wmv,flv,webm,mkv|max:10240000', // 10GB max
            'videos.*.thumbnail' => 'nullable|file|mimes:jpg,jpeg,png,gif|max:10240', // 10MB max
        ]);

        $channel = Channel::findOrFail($request->channel_id);

        // Verify user owns the channel
        if ($channel->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado para usar este canal'], 403);
        }

        $uploadedVideos = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($request->videos as $index => $videoData) {
                $uploadPath = 'videos/' . auth()->id() . '/' . $channel->id;

                // Store video file
                $videoFile = $videoData['video_file'];
                $videoPath = $videoFile->store($uploadPath, 'public');

                // Store thumbnail if provided
                $thumbnailPath = null;
                if (isset($videoData['thumbnail'])) {
                    $thumbnailFile = $videoData['thumbnail'];
                    $thumbnailPath = $thumbnailFile->store($uploadPath . '/thumbnails', 'public');
                }

                // Process hashtags
                $hashtags = [];
                if (!empty($videoData['hashtags'])) {
                    $hashtags = array_filter(
                        array_map('trim', explode('#', $videoData['hashtags'])),
                        fn($tag) => !empty($tag)
                    );
                }

                // Create video record
                $video = Video::create([
                    'user_id' => auth()->id(),
                    'channel_id' => $channel->id,
                    'title' => $videoData['title'],
                    'description' => $videoData['description'] ?? '',
                    'file_path' => $videoPath,
                    'thumbnail_path' => $thumbnailPath,
                    'tags' => $hashtags,
                    'made_for_kids' => $videoData['for_kids'] ?? false,
                    'privacy' => 'public', // Default privacy
                    'scheduled_for' => $videoData['scheduled_at'],
                    'status' => 'pending',
                    'file_size' => $videoFile->getSize(),
                ]);

                // Create video schedule
                $videoSchedule = VideoSchedule::create([
                    'video_id' => $video->id,
                    'scheduled_at' => $videoData['scheduled_at'],
                    'status' => 'pending',
                    'action' => 'upload',
                    'action_parameters' => [
                        'privacy' => 'public',
                        'made_for_kids' => $videoData['for_kids'] ?? false,
                        'age_restricted' => $videoData['age_restricted'] ?? false,
                    ],
                ]);

                // Try to upload to YouTube immediately if possible
                $this->attemptYoutubeUpload($video);

                $uploadedVideos[] = [
                    'video' => $video->load('channel'),
                    'schedule' => $videoSchedule,
                    'index' => $index,
                ];

                // Log successful upload
                Log::info('Video uploaded successfully', [
                    'video_id' => $video->id,
                    'user_id' => auth()->id(),
                    'channel_id' => $channel->id,
                    'title' => $video->title,
                    'file_size' => $video->file_size,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Videos subidos exitosamente',
                'uploaded_videos' => $uploadedVideos,
                'total_uploaded' => count($uploadedVideos),
                'channel' => $channel,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            // Clean up uploaded files if transaction fails
            foreach ($uploadedVideos as $uploadedVideo) {
                if (isset($uploadedVideo['video']->file_path)) {
                    Storage::disk('public')->delete($uploadedVideo['video']->file_path);
                }
                if (isset($uploadedVideo['video']->thumbnail_path)) {
                    Storage::disk('public')->delete($uploadedVideo['video']->thumbnail_path);
                }
            }

            Log::error('Bulk video upload failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'channel_id' => $request->channel_id,
            ]);

            return response()->json([
                'error' => 'Error al subir videos: ' . $e->getMessage(),
                'errors' => $errors,
            ], 500);
        }
    }

    /**
     * Upload single video file
     */
    public function uploadSingle(Request $request)
    {
        $request->validate([
            'channel_id' => 'required|exists:channels,id',
            'title' => 'required|string|max:100|min:3',
            'description' => 'nullable|string',
            'hashtags' => 'nullable|string',
            'scheduled_at' => 'required|date|after:now',
            'for_kids' => 'boolean',
            'age_restricted' => 'boolean',
            'video_file' => 'required|file|mimes:mp4,avi,mov,wmv,flv,webm,mkv|max:10240000', // 10GB max
            'thumbnail' => 'nullable|file|mimes:jpg,jpeg,png,gif|max:10240', // 10MB max
        ]);

        $channel = Channel::findOrFail($request->channel_id);

        // Verify user owns the channel
        if ($channel->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado para usar este canal'], 403);
        }

        try {
            $uploadPath = 'videos/' . auth()->id() . '/' . $channel->id;

            // Store video file
            $videoFile = $request->file('video_file');
            $videoPath = $videoFile->store($uploadPath, 'public');

            // Store thumbnail if provided
            $thumbnailPath = null;
            if ($request->hasFile('thumbnail')) {
                $thumbnailFile = $request->file('thumbnail');
                $thumbnailPath = $thumbnailFile->store($uploadPath . '/thumbnails', 'public');
            }

            // Process hashtags
            $hashtags = [];
            if (!empty($request->hashtags)) {
                $hashtags = array_filter(
                    array_map('trim', explode('#', $request->hashtags)),
                    fn($tag) => !empty($tag)
                );
            }

            // Create video record
            $video = Video::create([
                'user_id' => auth()->id(),
                'channel_id' => $channel->id,
                'title' => $request->title,
                'description' => $request->description ?? '',
                'file_path' => $videoPath,
                'thumbnail_path' => $thumbnailPath,
                'tags' => $hashtags,
                'made_for_kids' => $request->for_kids ?? false,
                'privacy' => 'public',
                'scheduled_for' => $request->scheduled_at,
                'status' => 'pending',
                'file_size' => $videoFile->getSize(),
            ]);

            // Create video schedule
            $videoSchedule = VideoSchedule::create([
                'video_id' => $video->id,
                'scheduled_at' => $request->scheduled_at,
                'status' => 'pending',
                'action' => 'upload',
                'action_parameters' => [
                    'privacy' => 'public',
                    'made_for_kids' => $request->for_kids ?? false,
                    'age_restricted' => $request->age_restricted ?? false,
                ],
            ]);

            // Try to upload to YouTube immediately if possible
            $this->attemptYoutubeUpload($video);

            Log::info('Single video uploaded successfully', [
                'video_id' => $video->id,
                'user_id' => auth()->id(),
                'channel_id' => $channel->id,
                'title' => $video->title,
                'file_size' => $video->file_size,
            ]);

            return response()->json([
                'message' => 'Video subido exitosamente',
                'video' => $video->load('channel'),
                'schedule' => $videoSchedule,
                'channel' => $channel,
            ], 201);
        } catch (\Exception $e) {
            // Clean up uploaded files if something fails
            if (isset($videoPath)) {
                Storage::disk('public')->delete($videoPath);
            }
            if (isset($thumbnailPath)) {
                Storage::disk('public')->delete($thumbnailPath);
            }

            Log::error('Single video upload failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'channel_id' => $request->channel_id,
            ]);

            return response()->json([
                'error' => 'Error al subir video: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get upload progress (mock for now - could be enhanced with real-time tracking)
     */
    public function getUploadProgress($videoId)
    {
        $video = Video::findOrFail($videoId);

        // Verify user owns the video
        if ($video->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        return response()->json([
            'video_id' => $video->id,
            'status' => $video->status,
            'progress' => $this->calculateProgress($video),
        ]);
    }

    /**
     * Calculate upload progress based on video status
     */
    private function calculateProgress(Video $video): int
    {
        switch ($video->status) {
            case 'pending':
                return 0;
            case 'uploading':
                return 50;
            case 'scheduled':
                return 100;
            case 'published':
                return 100;
            case 'failed':
                return 0;
            default:
                return 0;
        }
    }

    /**
     * Attempt to upload video to YouTube
     */
    private function attemptYoutubeUpload(Video $video): void
    {
        try {
            // Check if channel has valid YouTube credentials
            if (!$this->youtubeService->hasValidCredentials($video->channel)) {
                Log::warning('No valid YouTube credentials for channel', [
                    'video_id' => $video->id,
                    'channel_id' => $video->channel_id,
                ]);

                $video->update([
                    'status' => 'scheduled', // Keep as scheduled if no credentials
                    'upload_error' => 'No valid YouTube credentials found for channel',
                ]);
                return;
            }

            // Update status to uploading
            $video->update(['status' => 'uploading']);

            // Attempt YouTube upload
            $result = $this->youtubeService->uploadVideo($video);

            if ($result['success']) {
                Log::info('Video successfully uploaded to YouTube', [
                    'video_id' => $video->id,
                    'youtube_video_id' => $result['youtube_video_id'],
                ]);
            } else {
                Log::error('YouTube upload failed', [
                    'video_id' => $video->id,
                    'error' => $result['error'],
                ]);

                $video->update([
                    'status' => 'failed',
                    'upload_error' => $result['error'],
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Exception during YouTube upload attempt', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
            ]);

            $video->update([
                'status' => 'failed',
                'upload_error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Upload a single file (for progress tracking in UI)
     */
    public function uploadSingleFile(Request $request)
    {
        $request->validate([
            'video_file' => 'required|file|mimes:mp4,avi,mov,wmv,flv,webm,mkv|max:10240000', // 10GB max
        ]);

        try {
            $uploadPath = 'videos/' . auth()->id();

            if ($request->hasFile('video_file')) {
                $file = $request->file('video_file');
                $filePath = $file->store($uploadPath, 'public');

                return response()->json([
                    'success' => true,
                    'message' => 'Archivo subido exitosamente',
                    'data' => [
                        'file_path' => $filePath,
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No se recibió ningún archivo'
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error uploading single file', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error durante la subida del archivo: ' . $e->getMessage()
            ], 500);
        }
    }
}
