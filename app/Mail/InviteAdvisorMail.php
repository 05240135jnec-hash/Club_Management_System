<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InviteAdvisorMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $inviteUrl;
    public string $clubName;

    public function __construct(string $inviteUrl, string $clubName)
    {
        $this->inviteUrl = $inviteUrl;
        $this->clubName  = $clubName;
    }

    public function build(): self
    {
        return $this
            ->subject('You are invited to be an Advisor – ' . $this->clubName)
            ->view('emails.invite-advisor');
    }
}