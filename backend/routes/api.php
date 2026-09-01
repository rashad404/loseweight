<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FoodSearchController;
use App\Http\Controllers\Api\GuideController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\ProgressSyncController;
use App\Http\Controllers\Api\RoutineParseController;
use App\Http\Controllers\Api\SubscriberController;
use App\Http\Controllers\Api\SupportCircleController;
use App\Http\Controllers\Api\WeightEntryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API
|--------------------------------------------------------------------------
| Calculators run entirely in the browser; this API only serves content and
| the small amount of state a signed-in member chooses to save.
*/

Route::get('/health', fn () => response()->json(['status' => 'ok', 'time' => now()->toIso8601String()]));

Route::prefix('guides')->group(function () {
    Route::get('/', [GuideController::class, 'index']);
    Route::get('/categories', [GuideController::class, 'categories']);
    Route::get('/sitemap', [GuideController::class, 'sitemap']);
    Route::get('/{slug}', [GuideController::class, 'show']);
});

Route::post('/subscribers', [SubscriberController::class, 'store'])->middleware('throttle:10,1');
Route::post('/subscribers/{token}/unsubscribe', [SubscriberController::class, 'unsubscribe']);

// Routine parsing. Rate limited on top of the per-user spend cap, because a
// throttle stops abuse cheaply and the spend cap stops it expensively.
Route::post('/routine/parse', [RoutineParseController::class, 'store'])
    ->middleware('throttle:20,1');
Route::get('/ai/status', [RoutineParseController::class, 'status']);

// Food lookup. Only foods the client cannot resolve locally reach this.
Route::get('/food/search', [FoodSearchController::class, 'search'])
    ->middleware('throttle:60,1');

// Kimlik.az OAuth (PKCE)
Route::post('/auth/wallet/callback', [AuthController::class, 'walletCallback'])->middleware('throttle:20,1');

/*
|--------------------------------------------------------------------------
| Authenticated member API
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/me', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/plan', [PlanController::class, 'show']);
    Route::post('/plan', [PlanController::class, 'store']);
    Route::delete('/plan/{plan}', [PlanController::class, 'destroy']);

    Route::get('/weight-entries', [WeightEntryController::class, 'index']);
    Route::post('/weight-entries', [WeightEntryController::class, 'store']);
    Route::delete('/weight-entries/{weightEntry}', [WeightEntryController::class, 'destroy']);

    Route::get('/progress', [ProgressSyncController::class, 'show']);
    Route::put('/progress', [ProgressSyncController::class, 'update']);

    Route::post('/circles', [SupportCircleController::class, 'store']);
    Route::post('/circles/join', [SupportCircleController::class, 'join']);
    Route::get('/circles/{circle}', [SupportCircleController::class, 'show']);
    Route::put('/circles/{circle}/contribution', [SupportCircleController::class, 'contribute']);
    Route::post('/circles/{circle}/reaction', [SupportCircleController::class, 'react']);
});
