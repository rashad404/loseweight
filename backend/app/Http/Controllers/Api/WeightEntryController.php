<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WeightEntry;
use Illuminate\Http\Request;

class WeightEntryController extends Controller
{
    public function index(Request $request)
    {
        $entries = $request->user()->weightEntries()
            ->orderBy('recorded_on')
            ->get();

        return response()->json(['data' => $entries]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'recorded_on' => ['required', 'date', 'before_or_equal:today'],
            'weight_kg' => ['required', 'numeric', 'min:35', 'max:400'],
            'waist_cm' => ['nullable', 'numeric', 'min:40', 'max:250'],
            'note' => ['nullable', 'string', 'max:280'],
        ]);

        // One weigh-in per day: a repeat submission corrects that day's number.
        $entry = $request->user()->weightEntries()->updateOrCreate(
            ['recorded_on' => $data['recorded_on']],
            $data
        );

        return response()->json(['data' => $entry], 201);
    }

    public function destroy(Request $request, WeightEntry $weightEntry)
    {
        abort_unless($weightEntry->user_id === $request->user()->id, 403);

        $weightEntry->delete();

        return response()->json(['status' => 'success']);
    }
}
