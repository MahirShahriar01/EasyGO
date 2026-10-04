<?php

namespace App\Notifications;

use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Greets new customers after registration. */
class WelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $site = Setting::get('site_name', 'EasyGo');

        return (new MailMessage)
            ->subject("Welcome to {$site}!")
            ->greeting("Hello {$notifiable->name},")
            ->line("Thanks for joining {$site}. Hotels, flights, buses, tours and rental cars — all in one place.")
            ->action('Start exploring', url('/'))
            ->line('Use code WELCOME10 for 10% off your first booking.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Welcome aboard!',
            'message' => 'Use code WELCOME10 for 10% off your first booking.',
            'icon' => 'mdi-party-popper',
            'link' => '/',
        ];
    }
}
