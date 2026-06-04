<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdvisorApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $advisorName) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You are approved as Club Advisor — JNEC');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.advisor_approved',
            with: ['advisorName' => $this->advisorName],
        );
    }
}