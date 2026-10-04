<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Newsletter audience management and CSV export. */
class SubscriberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(NewsletterSubscriber::query()
            ->when($request->filled('q'), fn ($q) => $q->where('email', 'like', '%'.$request->query('q').'%'))
            ->latest()->paginate(20)->withQueryString());
    }

    public function destroy(NewsletterSubscriber $subscriber): JsonResponse
    {
        $subscriber->delete();

        return response()->json(['message' => 'Subscriber removed.']);
    }

    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Email', 'Active', 'Subscribed at']);
            NewsletterSubscriber::orderBy('id')->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $s) {
                    fputcsv($out, [$s->email, $s->is_active ? 'yes' : 'no', $s->created_at->toDateTimeString()]);
                }
            });
            fclose($out);
        }, 'easygo-subscribers.csv', ['Content-Type' => 'text/csv']);
    }
}
