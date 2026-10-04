<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Contact form and newsletter sign-up. */
class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'min:10', 'max:3000'],
        ]);

        ContactMessage::create($data + ['user_id' => $request->user('sanctum')?->id]);

        return response()->json(['message' => 'Thanks! Our support team will get back to you within 24 hours.'], 201);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:150']]);
        NewsletterSubscriber::updateOrCreate(['email' => strtolower($data['email'])], ['is_active' => true]);

        return response()->json(['message' => 'You are subscribed to EasyGo deals!']);
    }
}
