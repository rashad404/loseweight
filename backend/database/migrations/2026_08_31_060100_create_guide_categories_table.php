<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guide_categories', function (Blueprint $table) {
            $table->id();
            $table->string('language', 5)->index();
            $table->string('slug');
            $table->string('name');
            $table->string('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['language', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guide_categories');
    }
};
