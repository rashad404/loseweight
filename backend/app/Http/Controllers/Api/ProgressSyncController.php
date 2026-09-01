<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProgressSyncController extends Controller
{
    public function show(Request $request)
    {
        $progress = $request->user()->progressState;

        return response()->json(['data' => $progress ? [
            'revision' => $progress->revision,
            'state' => $progress->state,
            'updated_at' => $progress->updated_at,
        ] : null]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'revision' => ['required', 'integer', 'min:0'],
            'state' => ['required', 'array'],
            'state.version' => ['required', 'integer', 'in:2'],
            'state.game' => ['required', 'array'],
            'state.game.version' => ['required', 'integer', 'in:2'],
            'state.game.achievements' => ['present', 'array', 'max:100'],
            'state.game.preferences' => ['required', 'array'],
            'state.days' => ['present', 'array', 'max:31'],
        ]);

        $progress = $request->user()->progressState()->firstOrNew();
        if ($progress->exists && $data['revision'] !== $progress->revision) {
            return response()->json([
                'status' => 'conflict',
                'data' => ['revision' => $progress->revision, 'state' => $progress->state],
            ], 409);
        }

        $progress->revision = $progress->exists ? $progress->revision + 1 : 1;
        $progress->state = $data['state'];
        $progress->save();

        return response()->json(['data' => [
            'revision' => $progress->revision,
            'state' => $progress->state,
            'updated_at' => $progress->updated_at,
        ]]);
    }
}
