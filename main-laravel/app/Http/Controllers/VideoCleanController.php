<?php

namespace App\Http\Controllers;

use App\Services\VideoCleanService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class VideoCleanController extends Controller
{
    protected VideoCleanService $videoCleanService;

    public function __construct(VideoCleanService $videoCleanService)
    {
        $this->videoCleanService = $videoCleanService;
    }

    public function process(Request $request): JsonResponse
    {
        $request->validate([
            'videos' => 'required|array|min:1|max:10',
            'videos.*' => 'required|file|mimes:mp4,avi,mov|max:512000', // 500MB
            'watermark_positions' => 'required|array|min:1',
            'watermark_positions.*' => 'string|in:arriba-izquierda,arriba-derecha,medio-izquierda,medio-derecha,abajo-izquierda,abajo-derecha',
        ]);

        try {
            $batchId = Str::uuid();
            $results = $this->videoCleanService->processVideos(
                $request->file('videos'),
                $request->input('watermark_positions'),
                $batchId
            );

            return response()->json([
                'success' => true,
                'batch_id' => $batchId,
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function status(Request $request, int $id): JsonResponse
    {
        try {
            $status = $this->videoCleanService->getStatus($id);

            return response()->json([
                'success' => true,
                'data' => $status,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Video not found',
            ], 404);
        }
    }

    public function batchStatus(Request $request, string $batchId): JsonResponse
    {
        try {
            $statuses = $this->videoCleanService->getBatchStatus($batchId);

            return response()->json([
                'success' => true,
                'data' => $statuses,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Batch not found',
            ], 404);
        }
    }
}
