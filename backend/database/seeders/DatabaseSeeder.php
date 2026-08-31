<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@loseweight.net'],
            [
                'name' => 'LoseWeight Admin',
                'password' => env('ADMIN_SEED_PASSWORD', 'changeme-in-production'),
                'is_admin' => true,
                'locale' => 'en',
                'email_verified_at' => now(),
            ]
        );

        $this->call(GuideSeeder::class);
    }
}
