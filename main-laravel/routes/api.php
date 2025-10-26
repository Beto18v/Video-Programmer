<?php

use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\GoogleSheetsAuthController;
use App\Http\Controllers\SheetController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('web')->group(function () {
    Route::prefix('sheets')->name('sheets.')->group(function () {
        Route::post('tabs', [GoogleSheetsAuthController::class, 'listTabs'])->name('tabs');
        Route::post('data', [SheetController::class, 'getSheetData'])->name('data');
        Route::get('check-credentials', [SheetController::class, 'checkCredentials'])->name('check-credentials');
    });
});
