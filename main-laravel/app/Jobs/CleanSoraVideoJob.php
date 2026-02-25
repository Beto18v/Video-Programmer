<?php

namespace App\Jobs;

use App\Models\VideoCleaner;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class CleanSoraVideoJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $timeout = 3600; // 1 hour

    protected VideoCleaner $videoCleaner;

    /**
     * Create a new job instance.
     */
    public function __construct(VideoCleaner $videoCleaner)
    {
        $this->videoCleaner = $videoCleaner;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $this->videoCleaner->update(['status' => 'processing', 'progress' => 10]);

            $inputPath = Storage::disk('local')->path($this->videoCleaner->input_path);
            $outputPath = Storage::disk('local')->path($this->videoCleaner->output_path);

            // Ensure output directory exists
            $outputDir = dirname($outputPath);
            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $this->videoCleaner->update(['progress' => 20]);

            // Prepare Python command
            $pythonScript = base_path('app/Modules/VideoCleaner/Resources/python/remove_watermark.py');
            $positions = implode(',', $this->videoCleaner->watermark_positions);

            $process = new Process([
                'C:/Users/RYZEN 5 3600/AppData/Roaming/pypoetry/venv/Scripts/python.exe',
                $pythonScript,
                '--input',
                $inputPath,
                '--output',
                $outputPath,
                '--positions',
                $positions,
                '--extraction-fps',
                '1',  // Optimized for speed
                '--detection-interval',
                '30',  // Detect every 30 frames
                '--inpaint-method',
                'telea',  // Faster method
                '--inpaint-radius',
                '3',
            ]);

            $process->setTimeout(3600); // 1 hour
            $process->run();

            $this->videoCleaner->update(['progress' => 80]);

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }

            $this->videoCleaner->update([
                'status' => 'completed',
                'progress' => 100,
            ]);

            Log::info("Video cleaning completed for ID: {$this->videoCleaner->id}");
        } catch (\Exception $e) {
            $this->videoCleaner->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            Log::error("Video cleaning failed for ID: {$this->videoCleaner->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e; // Re-throw to mark job as failed
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $this->videoCleaner->update([
            'status' => 'failed',
            'error_message' => $exception->getMessage(),
        ]);

        Log::error("CleanSoraVideoJob failed permanently for ID: {$this->videoCleaner->id}", [
            'error' => $exception->getMessage(),
        ]);
    }
}
