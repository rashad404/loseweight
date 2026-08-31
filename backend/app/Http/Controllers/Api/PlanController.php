<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function show(Request $request)
    {
        $plan = $request->user()->plans()->latest()->first();

        return response()->json(['data' => $plan]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sex' => ['required', 'in:male,female'],
            'age' => ['required', 'integer', 'min:16', 'max:100'],
            'height_cm' => ['required', 'numeric', 'min:120', 'max:250'],
            'start_weight_kg' => ['required', 'numeric', 'min:35', 'max:400'],
            'goal_weight_kg' => ['required', 'numeric', 'min:35', 'max:400'],
            'activity_factor' => ['required', 'numeric', 'min:1.2', 'max:1.9'],
            'rate_kg_per_week' => ['required', 'numeric', 'min:0.1', 'max:1.0'],
            'units' => ['required', 'in:metric,imperial'],
            'bmr' => ['required', 'integer'],
            'tdee' => ['required', 'integer'],
            'target_calories' => ['required', 'integer'],
            'protein_g' => ['required', 'integer'],
            'fiber_g' => ['required', 'integer'],
            'estimated_weeks' => ['required', 'integer'],
            'started_on' => ['required', 'date'],
            'target_date' => ['required', 'date'],
        ]);

        $plan = $request->user()->plans()->create($data);

        return response()->json(['data' => $plan], 201);
    }

    public function destroy(Request $request, Plan $plan)
    {
        abort_unless($plan->user_id === $request->user()->id, 403);

        $plan->delete();

        return response()->json(['status' => 'success']);
    }
}
