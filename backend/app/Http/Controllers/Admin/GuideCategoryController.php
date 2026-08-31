<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GuideCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GuideCategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = GuideCategory::query()
            ->when($request->query('lang'), fn ($q, $lang) => $q->where('language', $lang))
            ->withCount('guides')
            ->orderBy('language')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'language' => ['required', 'in:en,az,ru'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);

        return response()->json(['data' => GuideCategory::create($data)], 201);
    }

    public function update(Request $request, GuideCategory $guideCategory)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        }

        $guideCategory->update($data);

        return response()->json(['data' => $guideCategory->fresh()]);
    }

    public function destroy(GuideCategory $guideCategory)
    {
        $guideCategory->delete();

        return response()->json(['status' => 'success']);
    }
}
