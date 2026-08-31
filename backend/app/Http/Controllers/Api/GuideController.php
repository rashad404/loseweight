<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GuideResource;
use App\Models\Guide;
use App\Models\GuideCategory;
use Illuminate\Http\Request;

class GuideController extends Controller
{
    private const LANGUAGES = ['en', 'az', 'ru'];

    private function language(Request $request): string
    {
        $lang = (string) $request->query('lang', 'en');

        return in_array($lang, self::LANGUAGES, true) ? $lang : 'en';
    }

    public function index(Request $request)
    {
        $language = $this->language($request);

        $guides = Guide::query()
            ->with('category')
            ->inLanguage($language)
            ->published()
            ->when($request->query('category'), function ($query, $slug) use ($language) {
                $query->whereHas('category', fn ($q) => $q->where('slug', $slug)->where('language', $language));
            })
            ->when($request->query('author'), fn ($q, $author) => $q->where('author_name', $author))
            ->when($request->query('q'), function ($query, $term) {
                $query->where(function ($q) use ($term) {
                    $q->where('title', 'like', "%{$term}%")
                        ->orWhere('excerpt', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('published_at')
            ->paginate(min((int) $request->query('per_page', 12), 50));

        return GuideResource::collection($guides);
    }

    public function show(Request $request, string $slug)
    {
        $language = $this->language($request);

        $guide = Guide::query()
            ->with('category')
            ->inLanguage($language)
            ->published()
            ->where('slug', $slug)
            ->firstOrFail();

        $guide->incrementQuietly('views');

        return (new GuideResource($guide))->withBody();
    }

    public function categories(Request $request)
    {
        $language = $this->language($request);

        $categories = GuideCategory::query()
            ->inLanguage($language)
            ->withCount(['guides' => fn ($q) => $q->published()])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($c) => [
                'slug' => $c->slug,
                'name' => $c->name,
                'description' => $c->description,
                'guides_count' => $c->guides_count,
            ]);

        return response()->json(['data' => $categories]);
    }

    /** Slugs of every published guide per language, for the Next.js sitemap. */
    public function sitemap()
    {
        $guides = Guide::query()
            ->published()
            ->get(['language', 'slug', 'updated_at'])
            ->map(fn ($g) => [
                'language' => $g->language,
                'slug' => $g->slug,
                'updated_at' => $g->updated_at->toIso8601String(),
            ]);

        return response()->json(['data' => $guides]);
    }
}
