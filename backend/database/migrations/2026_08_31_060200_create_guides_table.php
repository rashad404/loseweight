<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guides', function (Blueprint $table) {
            $table->id();
            // Each guide is authored in ONE language and only ever shown in that locale.
            $table->string('language', 5)->index();
            $table->foreignId('guide_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->string('excerpt', 500)->nullable();
            $table->longText('body');
            $table->string('hero_image')->nullable();

            // Editorial / medical review trail
            $table->string('author_name')->nullable();
            $table->string('reviewer_name')->nullable();
            $table->string('reviewer_credentials')->nullable();
            $table->date('reviewed_at')->nullable();
            $table->json('sources')->nullable();

            // SEO
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 320)->nullable();

            $table->unsignedInteger('reading_minutes')->default(1);
            $table->unsignedBigInteger('views')->default(0);
            $table->enum('status', ['draft', 'published'])->default('draft')->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['language', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guides');
    }
};
