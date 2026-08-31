<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscriber;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubscriberController extends Controller
{
    public function index(Request $request)
    {
        $subscribers = Subscriber::query()
            ->when($request->query('q'), fn ($q, $term) => $q->where('email', 'like', "%{$term}%"))
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->query('per_page', 50), 200));

        return response()->json($subscribers);
    }

    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['email', 'locale', 'source', 'subscribed_at']);

            Subscriber::whereNull('unsubscribed_at')->orderBy('id')->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $row) {
                    fputcsv($out, [$row->email, $row->locale, $row->source, $row->created_at->toDateString()]);
                }
            });

            fclose($out);
        }, 'subscribers-'.now()->toDateString().'.csv', ['Content-Type' => 'text/csv']);
    }

    public function destroy(Subscriber $subscriber)
    {
        $subscriber->delete();

        return response()->json(['status' => 'success']);
    }
}
