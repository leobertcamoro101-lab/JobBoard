<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ConfirmationCodeMail extends Mailable
{
    public function __construct(public string $code, public int $minutes = 15)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your JobBoard confirmation code');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.confirmation-code');
    }
}