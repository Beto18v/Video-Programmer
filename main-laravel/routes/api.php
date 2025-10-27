<?php

use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\GoogleSheetsAuthController;
use App\Http\Controllers\SheetController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Las rutas de sheets ahora están en web.php para mantener la sesión y CSRF
