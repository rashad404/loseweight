<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportCircleTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_can_create_join_and_contribute_without_body_data(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $created = $this->postJson('/api/circles', [
            'name' => 'Sunday walkers', 'collective_target' => 20, 'display_name' => 'R',
        ])->assertCreated()->assertJsonMissing(['weight', 'calories']);

        $circleId = $created->json('data.id');
        $invite = $created->json('data.invite_code');

        $member = User::factory()->create();
        Sanctum::actingAs($member);
        $this->postJson('/api/circles/join', [
            'invite_code' => $invite, 'display_name' => 'M',
        ])->assertOk()->assertJsonCount(2, 'data.members');

        $this->putJson("/api/circles/{$circleId}/contribution", ['contribution' => 4])
            ->assertOk()->assertJsonFragment(['display_name' => 'M', 'contribution' => 4]);
    }

    public function test_non_members_cannot_read_or_react_to_a_circle(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $circleId = $this->postJson('/api/circles', [
            'name' => 'Private', 'collective_target' => 10, 'display_name' => 'Owner',
        ])->json('data.id');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/circles/{$circleId}")->assertForbidden();
        $this->postJson("/api/circles/{$circleId}/reaction", ['member_id' => 1, 'reaction' => 'heart'])
            ->assertForbidden();
    }
}
