<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('progress_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('revision')->default(0);
            $table->json('state');
            $table->timestamps();
        });

        Schema::create('support_circles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('invite_code', 12)->unique();
            $table->unsignedSmallInteger('collective_target')->default(20);
            $table->timestamps();
        });

        Schema::create('support_circle_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_circle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('display_name', 80);
            $table->unsignedSmallInteger('contribution')->default(0);
            $table->enum('reaction', ['heart', 'clap', 'support'])->nullable();
            $table->timestamps();
            $table->unique(['support_circle_id', 'user_id']);
        });

        Schema::create('gamification_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 40);
            $table->json('properties');
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['name', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gamification_events');
        Schema::dropIfExists('support_circle_members');
        Schema::dropIfExists('support_circles');
        Schema::dropIfExists('progress_states');
    }
};
