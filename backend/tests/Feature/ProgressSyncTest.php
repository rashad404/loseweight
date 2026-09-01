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
            'version' => 1,
            'actions' => [['id' => 'a', 'state' => 'completed']],
            'achievements' => [],
            'preferences' => ['enabled' => true, 'mode' => 'maintenance'],
        ];

        $this->putJson('/api/progress', ['revision' => 0, 'state' => $state])
            ->assertOk()->assertJsonPath('data.revision', 1);

        $this->getJson('/api/progress')->assertOk()
            ->assertJsonPath('data.state.actions.0.state', 'completed');

        $this->putJson('/api/progress', ['revision' => 0, 'state' => $state])
            ->assertConflict()->assertJsonPath('status', 'conflict')
            ->assertJsonPath('data.revision', 1);
    }

    public function test_progress_rejects_unbounded_or_invalid_payloads(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->putJson('/api/progress', [
            'revision' => 0,
            'state' => ['version' => 2, 'actions' => [], 'achievements' => [], 'preferences' => []],
        ])->assertUnprocessable();
    }
}
