<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Notifications\ContactReplied;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

/** Support inbox for contact-form messages. */
class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(ContactMessage::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w->where('subject', 'like', '%'.$request->query('q').'%')->orWhere('email', 'like', '%'.$request->query('q').'%')))
            ->latest()->paginate(15)->withQueryString());
    }

    public function show(ContactMessage $message): JsonResponse
    {
        if ($message->status === 'new') {
            $message->update(['status' => 'read']);
        }

        return response()->json($message);
    }

    public function reply(Request $request, ContactMessage $message): JsonResponse
    {
        $data = $request->validate(['reply' => ['required', 'string', 'min:2', 'max:5000']]);
        $message->update(['admin_reply' => $data['reply'], 'status' => 'replied', 'replied_at' => now()]);

        Notification::route('mail', $message->email)->notify(new ContactReplied($message));

        return response()->json(['message' => 'Reply sent to '.$message->email.'.', 'item' => $message]);
    }

    public function destroy(ContactMessage $message): JsonResponse
    {
        $message->delete();

        return response()->json(['message' => 'Message deleted.']);
    }
}
