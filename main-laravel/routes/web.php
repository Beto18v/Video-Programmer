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
use App\Http\Controllers\VideoUploadController;
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
    Route::post('channels/{channel}/sync', [ChannelController::class, 'sync'])->name('channels.sync');
    Route::post('channels/sync-all', [ChannelController::class, 'syncAll'])->name('channels.sync-all');

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
        Route::post('video-schedules/{videoSchedule}/upload', [VideoScheduleController::class, 'uploadFile'])->name('upload-file');
    });

    // Video upload routes
    Route::group(['as' => 'video-uploads.'], function () {
        Route::post('video-uploads/bulk', [VideoUploadController::class, 'bulkUpload'])->name('bulk-upload');
        Route::post('video-uploads/single', [VideoUploadController::class, 'uploadSingle'])->name('single-upload');
        Route::post('video-uploads/single-file', [VideoUploadController::class, 'uploadSingleFile'])->name('single-file-upload');
        Route::get('video-uploads/{video}/progress', [VideoUploadController::class, 'getUploadProgress'])->name('upload-progress');
    });

    Route::group(['as' => 'youtube-credentials.'], function () {
        Route::resource('youtube-credentials', YoutubeCredentialController::class);
    });

    // YouTube setup page
    Route::get('dashboard/youtube-setup', function () {
        return Inertia::render('dashboard/youtube-setup');
    })->name('youtube-setup');

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
        Route::post('tabs', [GoogleSheetsAuthController::class, 'listTabs'])->name('tabs');
        Route::post('data', [SheetController::class, 'getSheetData'])->name('data');
        Route::get('check-credentials', [SheetController::class, 'checkCredentials'])->name('check-credentials');
    });
});

require __DIR__ . '/settings.php';
