<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckVideoLimit
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, int $quantity = 1): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login')->with('error', 'Debes iniciar sesión para continuar.');
        }

        if (!$user->canUseVideos($quantity)) {
            $plan = $user->currentPlan;
            $remaining = $user->remaining_videos;

            if ($plan && $plan->hasUnlimitedVideos()) {
                return $next($request);
            }

            $message = $remaining === 0
                ? "Has alcanzado el límite de {$plan->video_limit} videos para tu plan {$plan->display_name} este mes."
                : "No puedes subir {$quantity} videos. Solo te quedan {$remaining} videos este mes en tu plan {$plan->display_name}.";

            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Límite de videos excedido',
                    'message' => $message,
                    'plan' => $plan->name,
                    'limit' => $plan->video_limit,
                    'remaining' => $remaining,
                    'used_this_month' => $user->videos_this_month,
                ], 403);
            }

            return back()->with('error', $message);
        }

        return $next($request);
    }
}
