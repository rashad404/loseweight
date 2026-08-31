<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriberController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'locale' => ['nullable', 'in:en,az,ru'],
            'source' => ['nullable', 'string', 'max:60'],
        ]);

        $subscriber = Subscriber::firstOrNew(['email' => strtolower($data['email'])]);

        if (! $subscriber->exists) {
            $subscriber->unsubscribe_token = Str::random(48);
        }

        $subscriber->fill([
            'locale' => $data['locale'] ?? 'en',
            'source' => $data['source'] ?? 'site',
            'unsubscribed_at' => null,
        ])->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Subscribed.',
        ], 201);
    }

    public function unsubscribe(string $token)
    {
        $subscriber = Subscriber::where('unsubscribe_token', $token)->firstOrFail();
        $subscriber->update(['unsubscribed_at' => now()]);

        return response()->json(['status' => 'success']);
    }
}
