<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Durable cache and spend ledger for AI calls.
     *
     * These live in the database rather than in a Node process because both
     * have to survive a restart. An in-memory spend cap resets whenever the
     * app reloads, which means it is not a cap at all.
     */
    public function up(): void
    {
        Schema::create('ai_parse_cache', function (Blueprint $table) {
            $table->id();
            // Hash of the normalised input, so identical descriptions are never
            // billed twice regardless of who submits them.
            $table->string('input_hash', 64)->unique();
            $table->string('feature', 40)->index();
            $table->json('result');
            $table->string('model', 60);
            $table->unsignedInteger('hits')->default(0);
            $table->timestamps();
        });

        Schema::create('ai_usage', function (Blueprint $table) {
            $table->id();
            $table->date('day')->index();
            // Anonymous per-browser key. No account exists, and none is needed
            // to enforce a per-user limit.
            $table->string('user_key', 64)->index();
            $table->string('feature', 40)->index();
            $table->string('model', 60);
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->decimal('cost_usd', 10, 6)->default(0);
            $table->boolean('cached')->default(false);
            $table->timestamps();

            $table->index(['day', 'user_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage');
        Schema::dropIfExists('ai_parse_cache');
    }
};
