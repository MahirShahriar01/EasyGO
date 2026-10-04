<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Sent when a booking is cancelled by the customer or by support, with refund info. */
class BookingCancelled extends Notification implements ShouldQueue
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
        $mail = (new MailMessage)
            ->subject("Booking cancelled — {$b->reference}")
            ->greeting("Hi {$b->contact_name},")
            ->line("Your booking **{$b->reference}** for {$b->item_name} has been cancelled.")
            ->line('Reason: '.$b->cancellation_reason);

        if ($b->refund_amount > 0) {
            $mail->line('A refund of **'.Setting::get('currency_symbol', '৳').number_format($b->refund_amount, 2).'** has been issued to your original payment method.');
        }

        return $mail->action('View booking', url('/account/bookings/'.$b->reference));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Booking cancelled',
            'message' => "Booking {$this->booking->reference} was cancelled".($this->booking->refund_amount > 0 ? ' and a refund was issued.' : '.'),
            'reference' => $this->booking->reference,
            'icon' => 'mdi-close-circle',
            'link' => '/account/bookings/'.$this->booking->reference,
        ];
    }
}
