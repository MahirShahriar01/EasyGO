<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Sent when a booking is paid (or reserved with pay-at-property). E-mail + in-app. */
class BookingConfirmed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $b = $this->booking;
        $money = fn ($v) => Setting::get('currency_symbol', '৳').number_format($v, 2);

        return (new MailMessage)
            ->subject("Booking confirmed — {$b->reference}")
            ->greeting("Hi {$b->contact_name},")
            ->line('Great news! Your booking is confirmed.')
            ->line("**{$b->item_name}**")
            ->line('Reference: **'.$b->reference.'**')
            ->line('Date: '.$b->start_date->format('D, d M Y').($b->end_date && $b->service_type !== 'tour' ? ' → '.$b->end_date->format('D, d M Y') : ''))
            ->line('Total: **'.$money($b->total).'** ('.($b->payment_status === 'paid' ? 'paid' : 'pay at property').')')
            ->action('View booking', url('/account/bookings/'.$b->reference))
            ->line('Thank you for travelling with '.Setting::get('site_name', 'EasyGo').'!');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Booking confirmed',
            'message' => "Your booking {$this->booking->reference} for {$this->booking->item_name} is confirmed.",
            'reference' => $this->booking->reference,
            'icon' => 'mdi-check-circle',
            'link' => '/account/bookings/'.$this->booking->reference,
        ];
    }
}
