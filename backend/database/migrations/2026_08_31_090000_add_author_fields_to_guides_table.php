<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Authorship has to be auditable, not decorative. The jurisdiction and
     * licensing flags exist so a page can never imply US licensure, and
     * `independent_review` records that author and reviewer are the same
     * person, which changes the wording the page is allowed to use.
     */
    public function up(): void
    {
        Schema::table('guides', function (Blueprint $table) {
            $table->string('author_credentials')->nullable()->after('author_name');
            $table->string('review_jurisdiction', 80)->nullable()->after('reviewer_credentials');
            $table->boolean('us_licensed')->default(false)->after('review_jurisdiction');
            $table->boolean('independent_review')->default(false)->after('us_licensed');
            $table->date('last_substantive_update')->nullable()->after('reviewed_at');
        });
    }

    public function down(): void
    {
        Schema::table('guides', function (Blueprint $table) {
            $table->dropColumn([
                'author_credentials', 'review_jurisdiction', 'us_licensed',
                'independent_review', 'last_substantive_update',
            ]);
        });
    }
};
