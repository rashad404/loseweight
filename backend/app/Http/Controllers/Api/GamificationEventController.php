<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GamificationEvent;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GamificationEventController extends Controller
{
    private const NAMES = [
        'today_viewed', 'action_completed', 'action_adjusted', 'action_rescheduled',
        'action_skipped', 'action_skipped_reasonable', 'quest_completed',
        'circle_created', 'encouragement_sent', 'gamification_disabled',
    ];

    private const PROPERTIES = ['sourceType', 'actionState', 'mode', 'achievementId', 'circleSize'];

    public function store(Request $request)
    {
        $data = $request->validate([
            'events' => ['required', 'array', 'max:100'],
            'events.*.name' => ['required', Rule::in(self::NAMES)],
            'events.*.at' => ['required', 'date'],
            'events.*.properties' => ['present', 'array'],
        ]);

        foreach ($data['events'] as $event) {
            $unknown = array_diff(array_keys($event['properties']), self::PROPERTIES);
            abort_if($unknown !== [], 422, 'Event contains a disallowed property.');
            GamificationEvent::create([
                'user_id' => $request->user()->id,
                'name' => $event['name'],
                'properties' => $event['properties'],
                'occurred_at' => $event['at'],
            ]);
        }

        return response()->json(['accepted' => count($data['events'])], 202);
    }

    public function report(Request $request)
    {
        abort_unless($request->user()->is_admin, 403);
        $since = now()->subDays(30);
        $rows = GamificationEvent::where('occurred_at', '>=', $since)->get();

        return response()->json(['data' => [
            'period_days' => 30,
            'events' => $rows->groupBy('name')->map->count(),
            'users' => $rows->pluck('user_id')->unique()->count(),
            'gamification_disabled' => $rows->where('name', 'gamification_disabled')->count(),
            'recovery_actions' => $rows->where('name', 'action_skipped_reasonable')->count(),
        ]]);
    }
}
