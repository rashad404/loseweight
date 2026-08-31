<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weight_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('recorded_on');
            $table->decimal('weight_kg', 5, 1);
            $table->decimal('waist_cm', 5, 1)->nullable();
            $table->string('note', 280)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'recorded_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weight_entries');
    }
};
