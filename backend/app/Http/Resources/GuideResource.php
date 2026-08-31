<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GuideResource extends JsonResource
{
    /** Set to true by the show endpoint so listings stay light. */
    public bool $withBody = false;

    public function withBody(bool $value = true): static
    {
        $this->withBody = $value;

        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'language' => $this->language,
            'slug' => $this->slug,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            'hero_image' => $this->hero_image,
            'reading_minutes' => $this->reading_minutes,
            'published_at' => $this->published_at?->toIso8601String(),
            'category' => $this->whenLoaded('category', fn () => [
                'slug' => $this->category->slug,
                'name' => $this->category->name,
            ]),
            'review' => [
                'author_name' => $this->author_name,
                'reviewer_name' => $this->reviewer_name,
                'reviewer_credentials' => $this->reviewer_credentials,
                'reviewed_at' => $this->reviewed_at?->toDateString(),
            ],
            $this->mergeWhen($this->withBody, fn () => [
                'body' => $this->body,
                'sources' => $this->sources ?? [],
                'meta_title' => $this->meta_title,
                'meta_description' => $this->meta_description,
            ]),
        ];
    }
}
