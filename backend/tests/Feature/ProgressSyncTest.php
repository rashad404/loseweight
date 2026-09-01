<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProgressSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_progress_requires_authentication(): void
    {
        $this->getJson('/api/progress')->assertUnauthorized();
    }

    public function test_progress_round_trips_and_detects_revision_conflicts(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $state = [
            'version' => 2,
            'game' => ['version' => 2, 'achievements' => [], 'preferences' => ['enabled' => true, 'mode' => 'maintenance']],
            'days' => [['date' => '2026-08-31', 'followed' => ['a'], 'skipped' => [], 'usedFlexibleMeal' => false]],
        ];

        $this->putJson('/api/progress', ['revision' => 0, 'state' => $state])
            ->assertOk()->assertJsonPath('data.revision', 1);

        $this->getJson('/api/progress')->assertOk()
            ->assertJsonPath('data.state.days.0.followed.0', 'a');

        $this->putJson('/api/progress', ['revision' => 0, 'state' => $state])
            ->assertConflict()->assertJsonPath('status', 'conflict')
            ->assertJsonPath('data.revision', 1);
    }

    public function test_progress_rejects_unbounded_or_invalid_payloads(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->putJson('/api/progress', [
            'revision' => 0,
            'state' => ['version' => 1, 'game' => [], 'days' => []],
        ])->assertUnprocessable();
    }
}
