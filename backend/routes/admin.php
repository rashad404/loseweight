<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\GuideCategoryController;
use App\Http\Controllers\Admin\GuideController;
use App\Http\Controllers\Admin\SubscriberController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('guides', GuideController::class);
    Route::apiResource('categories', GuideCategoryController::class)->except('show')
        ->parameters(['categories' => 'guideCategory']);

    Route::get('subscribers/export', [SubscriberController::class, 'export']);
    Route::get('subscribers', [SubscriberController::class, 'index']);
    Route::delete('subscribers/{subscriber}', [SubscriberController::class, 'destroy']);
});
