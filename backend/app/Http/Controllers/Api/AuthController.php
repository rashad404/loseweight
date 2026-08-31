<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Exchange a Kimlik.az PKCE authorization code for our own Sanctum token.
     */
    public function walletCallback(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
            'code_verifier' => ['required', 'string'],
            'redirect_uri' => ['required', 'string', 'url'],
            'locale' => ['nullable', 'in:en,az,ru'],
        ]);

        $apiUrl = rtrim((string) config('services.wallet.api_url'), '/');

        $tokenResponse = Http::asForm()->post("{$apiUrl}/oauth/token", [
            'grant_type' => 'authorization_code',
            'client_id' => config('services.wallet.client_id'),
            'client_secret' => config('services.wallet.client_secret'),
            'code' => $data['code'],
            'redirect_uri' => $data['redirect_uri'],
            'code_verifier' => $data['code_verifier'],
        ]);

        if (! $tokenResponse->successful() || ! $tokenResponse->json('access_token')) {
            Log::error('Kimlik.az token exchange failed', [
                'status' => $tokenResponse->status(),
                'body' => $tokenResponse->body(),
            ]);

            return response()->json(['status' => 'error', 'message' => 'Failed to exchange authorization code.'], 400);
        }

        $tokens = $tokenResponse->json();

        $userResponse = Http::withToken($tokens['access_token'])->get("{$apiUrl}/oauth/user");

        if (! $userResponse->successful()) {
            Log::error('Kimlik.az user fetch failed', ['status' => $userResponse->status()]);

            return response()->json(['status' => 'error', 'message' => 'Failed to fetch profile.'], 400);
        }

        $walletUser = $userResponse->json('data') ?? $userResponse->json();

        $user = User::where('wallet_id', $walletUser['id'])
            ->when(! empty($walletUser['email']), fn ($q) => $q->orWhere('email', $walletUser['email']))
            ->first();

        $attributes = [
            'wallet_id' => $walletUser['id'],
            'name' => $walletUser['name'] ?? 'Member',
            'phone' => $walletUser['phone'] ?? null,
            'wallet_access_token' => $tokens['access_token'],
            'wallet_refresh_token' => $tokens['refresh_token'] ?? null,
            'wallet_token_expires_at' => now()->addSeconds($tokens['expires_in'] ?? 2592000),
        ];

        if ($user) {
            $user->update($attributes);
        } else {
            $user = User::create($attributes + [
                'email' => $walletUser['email'] ?? null,
                'locale' => $data['locale'] ?? 'en',
                'email_verified_at' => ($walletUser['verification']['email_verified'] ?? false) ? now() : null,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'token' => $user->createToken('auth-token')->plainTextToken,
            'user' => $this->present($user),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json(['data' => $this->present($request->user())]);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'locale' => ['sometimes', 'in:en,az,ru'],
        ]);

        $request->user()->update($data);

        return response()->json(['data' => $this->present($request->user()->fresh())]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['status' => 'success']);
    }

    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'locale' => $user->locale,
            'is_admin' => $user->is_admin,
        ];
    }
}
