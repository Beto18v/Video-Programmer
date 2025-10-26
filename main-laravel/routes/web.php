<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ChannelController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VideoController;
use App\Http\Controllers\VideoScheduleController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\YoutubeCredentialController;
use App\Http\Controllers\AccountManagementController;
use App\Http\Controllers\SheetController;
use App\Http\Controllers\GoogleSheetsAuthController;
use App\Models\Plan;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('pricing', function () {
    return Inertia::render('pricing', [
        'plans' => Plan::active()->orderBy('sort_order')->get(),
    ]);
})->name('pricing');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

    Route::resource('channels', ChannelController::class);
    Route::patch('channels/{channel}/restore', [ChannelController::class, 'restore'])->name('channels.restore');

    Route::group(['as' => 'plans.'], function () {
        Route::resource('plans', PlanController::class);
    });

    Route::group(['as' => 'subscriptions.'], function () {
        Route::resource('subscriptions', SubscriptionController::class);
    });

    Route::group(['as' => 'users.'], function () {
        Route::resource('users', UserController::class);
        Route::patch('users/{user}/restore', [UserController::class, 'restore'])->withTrashed()->name('users.restore');
        Route::patch('users/{user}/make-admin', [UserController::class, 'makeAdmin'])->name('users.make-admin');
    });

    Route::get('account-management', [AccountManagementController::class, 'index'])->middleware('admin')->name('account-management.index');

    Route::group(['as' => 'videos.'], function () {
        Route::resource('videos', VideoController::class);
    });

    Route::group(['as' => 'video-schedules.'], function () {
        Route::resource('video-schedules', VideoScheduleController::class);
    });

    Route::group(['as' => 'youtube-credentials.'], function () {
        Route::resource('youtube-credentials', YoutubeCredentialController::class);
    });

    Route::group(['as' => 'activity-logs.'], function () {
        Route::resource('activity-logs', ActivityLogController::class);
    });

    Route::get('auth/google/sheets', [GoogleSheetsAuthController::class, 'redirect'])->name('auth.google.sheets');

    Route::prefix('sheets')->name('sheets.')->group(function () {
        Route::get('auth/redirect', [GoogleAuthController::class, 'redirectForSheets'])->name('auth.redirect');
        Route::get('auth/callback', [GoogleSheetsAuthController::class, 'callback'])->name('auth.callback');
        Route::get('list', [GoogleSheetsAuthController::class, 'listSheets'])->name('list');
        Route::get('preview', [GoogleSheetsAuthController::class, 'previewTab'])->name('preview');
        Route::get('select', [SheetController::class, 'select'])->name('select');
    });
});

require __DIR__ . '/settings.php';
