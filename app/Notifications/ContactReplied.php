<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** E-mails the support team's answer to a contact-form enquiry. */
class ContactReplied extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public ContactMessage $contact) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Re: '.$this->contact->subject)
            ->greeting("Hi {$this->contact->name},")
            ->line($this->contact->admin_reply)
            ->line('— EasyGo Support');
    }
}
