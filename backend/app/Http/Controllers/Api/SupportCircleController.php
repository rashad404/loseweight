<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportCircle;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupportCircleController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'collective_target' => ['required', 'integer', 'min:5', 'max:500'],
            'display_name' => ['required', 'string', 'max:80'],
        ]);

        $circle = SupportCircle::create([
            'owner_id' => $request->user()->id,
            'name' => $data['name'],
            'collective_target' => $data['collective_target'],
            'invite_code' => strtoupper(Str::random(8)),
        ]);
        $circle->members()->create([
            'user_id' => $request->user()->id,
            'display_name' => $data['display_name'],
        ]);

        return response()->json(['data' => $this->present($circle)], 201);
    }

    public function show(Request $request, SupportCircle $circle)
    {
        abort_unless($circle->members()->where('user_id', $request->user()->id)->exists(), 403);

        return response()->json(['data' => $this->present($circle)]);
    }

    public function join(Request $request)
    {
        $data = $request->validate([
            'invite_code' => ['required', 'string', 'size:8'],
            'display_name' => ['required', 'string', 'max:80'],
        ]);
        $circle = SupportCircle::where('invite_code', strtoupper($data['invite_code']))->firstOrFail();
        $circle->members()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['display_name' => $data['display_name']],
        );

        return response()->json(['data' => $this->present($circle)]);
    }

    public function contribute(Request $request, SupportCircle $circle)
    {
        $data = $request->validate(['contribution' => ['required', 'integer', 'min:0', 'max:100']]);
        $member = $circle->members()->where('user_id', $request->user()->id)->firstOrFail();
        $member->update(['contribution' => $data['contribution']]);

        return response()->json(['data' => $this->present($circle)]);
    }

    public function react(Request $request, SupportCircle $circle)
    {
        abort_unless($circle->members()->where('user_id', $request->user()->id)->exists(), 403);
        $data = $request->validate([
            'member_id' => ['required', 'integer'],
            'reaction' => ['required', 'in:heart,clap,support'],
        ]);
        $member = $circle->members()->whereKey($data['member_id'])->firstOrFail();
        $member->update(['reaction' => $data['reaction']]);

        return response()->json(['data' => $this->present($circle)]);
    }

    private function present(SupportCircle $circle): array
    {
        $circle->load('members');

        return [
            'id' => $circle->id,
            'name' => $circle->name,
            'invite_code' => $circle->invite_code,
            'collective_target' => $circle->collective_target,
            'members' => $circle->members->map(fn ($member) => [
                'id' => $member->id,
                'display_name' => $member->display_name,
                'contribution' => $member->contribution,
                'reaction' => $member->reaction,
            ]),
        ];
    }
}
