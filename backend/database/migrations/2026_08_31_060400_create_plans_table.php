<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Inputs
            $table->enum('sex', ['male', 'female']);
            $table->unsignedTinyInteger('age');
            $table->decimal('height_cm', 5, 1);
            $table->decimal('start_weight_kg', 5, 1);
            $table->decimal('goal_weight_kg', 5, 1);
            $table->decimal('activity_factor', 3, 2);
            $table->decimal('rate_kg_per_week', 3, 2);
            $table->enum('units', ['metric', 'imperial'])->default('metric');

            // Computed snapshot (so a saved plan stays stable even if formulas evolve)
            $table->unsignedInteger('bmr');
            $table->unsignedInteger('tdee');
            $table->unsignedInteger('target_calories');
            $table->unsignedInteger('protein_g');
            $table->unsignedInteger('fiber_g');
            $table->unsignedSmallInteger('estimated_weeks');
            $table->date('started_on');
            $table->date('target_date');

            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
