<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GamificationEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_safe_events_are_accepted_without_health_data(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/progress/events', ['events' => [[
            'name' => 'action_completed',
            'at' => now()->toISOString(),
            'properties' => ['sourceType' => 'accepted_change', 'mode' => 'maintenance'],
        ]]])->assertAccepted()->assertJsonPath('accepted', 1);

        $this->assertDatabaseMissing('gamification_events', ['name' => 'weight']);
    }

    public function test_sensitive_or_unknown_properties_are_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/progress/events', ['events' => [[
            'name' => 'action_completed',
            'at' => now()->toISOString(),
            'properties' => ['weightKg' => 72],
        ]]])->assertUnprocessable();
    }

    public function test_only_admins_can_read_aggregate_insights(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/progress/insights')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $this->getJson('/api/progress/insights')->assertOk()
            ->assertJsonMissingPath('data.weight');
    }
}
