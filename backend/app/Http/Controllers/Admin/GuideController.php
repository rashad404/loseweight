<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guide;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class GuideController extends Controller
{
    public function index(Request $request)
    {
        $guides = Guide::query()
            ->with('category')
            ->when($request->query('lang'), fn ($q, $lang) => $q->where('language', $lang))
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('q'), fn ($q, $term) => $q->where('title', 'like', "%{$term}%"))
            ->orderByDesc('updated_at')
            ->paginate(min((int) $request->query('per_page', 20), 100));

        return response()->json($guides);
    }

    public function show(Guide $guide)
    {
        return response()->json(['data' => $guide->load('category')]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['language'], $data['slug'] ?? $data['title']);
        $data['reading_minutes'] = Guide::estimateReadingMinutes($data['body']);

        $guide = Guide::create($data);

        return response()->json(['data' => $guide], 201);
    }

    public function update(Request $request, Guide $guide)
    {
        $data = $this->validated($request, $guide);

        if (! empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['language'] ?? $guide->language, $data['slug'], $guide->id);
        }

        if (! empty($data['body'])) {
            $data['reading_minutes'] = Guide::estimateReadingMinutes($data['body']);
        }

        $guide->update($data);

        return response()->json(['data' => $guide->fresh()]);
    }

    public function destroy(Guide $guide)
    {
        $guide->delete();

        return response()->json(['status' => 'success']);
    }

    private function validated(Request $request, ?Guide $guide = null): array
    {
        $required = $guide ? 'sometimes' : 'required';

        $data = $request->validate([
            'language' => [$required, 'in:en,az,ru'],
            'guide_category_id' => ['nullable', 'exists:guide_categories,id'],
            'slug' => ['nullable', 'string', 'max:255'],
            'title' => [$required, 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => [$required, 'string'],
            'hero_image' => ['nullable', 'string', 'max:255'],
            'author_name' => ['nullable', 'string', 'max:255'],
            'reviewer_name' => ['nullable', 'string', 'max:255'],
            'reviewer_credentials' => ['nullable', 'string', 'max:255'],
            'reviewed_at' => ['nullable', 'date'],
            'sources' => ['nullable', 'array'],
            'sources.*.title' => ['required_with:sources', 'string', 'max:500'],
            'sources.*.url' => ['nullable', 'url', 'max:500'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:320'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'published_at' => ['nullable', 'date'],
        ]);

        // Publishing without an explicit date stamps "now" so the public listing picks it up.
        if (($data['status'] ?? null) === 'published' && empty($data['published_at']) && ! $guide?->published_at) {
            $data['published_at'] = now();
        }

        return $data;
    }

    private function uniqueSlug(string $language, string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: Str::random(8);
        $slug = $base;
        $i = 2;

        while (Guide::where('language', $language)->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
