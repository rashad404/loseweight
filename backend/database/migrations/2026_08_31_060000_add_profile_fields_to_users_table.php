<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('wallet_id')->nullable()->after('id')->index();
            $table->string('phone', 32)->nullable()->after('email');
            $table->boolean('is_admin')->default(false)->after('phone');
            $table->string('locale', 5)->default('en')->after('is_admin');
            $table->text('wallet_access_token')->nullable();
            $table->text('wallet_refresh_token')->nullable();
            $table->timestamp('wallet_token_expires_at')->nullable();
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'wallet_id', 'phone', 'is_admin', 'locale',
                'wallet_access_token', 'wallet_refresh_token', 'wallet_token_expires_at',
            ]);
        });
    }
};
