<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guide;
use App\Models\Plan;
use App\Models\Subscriber;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                'guides' => [
                    'total' => Guide::count(),
                    'published' => Guide::published()->count(),
                    'by_language' => Guide::selectRaw('language, count(*) as total')
                        ->groupBy('language')->pluck('total', 'language'),
                ],
                'subscribers' => [
                    'total' => Subscriber::whereNull('unsubscribed_at')->count(),
                    'last_7_days' => Subscriber::where('created_at', '>=', now()->subDays(7))->count(),
                ],
                'users' => User::count(),
                'plans' => Plan::count(),
                'top_guides' => Guide::published()
                    ->orderByDesc('views')
                    ->limit(10)
                    ->get(['id', 'title', 'language', 'slug', 'views']),
            ],
        ]);
    }
}
