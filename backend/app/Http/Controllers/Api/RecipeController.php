<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ai\RecipeStore;
use Illuminate\Http\Request;

/**
 * Feedback on proposed dish compositions.
 *
 * Confirmations are counted for a reviewer to look at later. They never promote
 * a composition on their own: a hundred people accepting a default is agreement
 * with a default, not evidence it is correct.
 */
class RecipeController extends Controller
{
    public function __construct(private readonly RecipeStore $recipes) {}

    public function confirm(Request $request, int $id)
    {
        $data = $request->validate([
            'ingredients' => ['sometimes', 'array', 'max:15'],
            'ingredients.*.food' => ['required_with:ingredients', 'string', 'max:80'],
            'ingredients.*.gramsLow' => ['required_with:ingredients', 'numeric', 'min:1', 'max:1000'],
            'ingredients.*.gramsHigh' => ['required_with:ingredients', 'numeric', 'min:1', 'max:1000'],
        ]);

        $row = $this->recipes->confirm($id, $data['ingredients'] ?? null);

        if (! $row) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['id' => $row->id, 'state' => $row->state]);
    }
}
