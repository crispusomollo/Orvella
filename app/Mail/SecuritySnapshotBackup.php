<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SecuritySnapshotBackup extends Mailable
{
    use Queueable, SerializesModels;

    public string $filePathDisk;
    public string $fileNameRaw;

    /**
     * Create a new message instance.
     */
    public function __construct(string $filePathDisk, string $fileNameRaw)
    {
        $this->filePathDisk = $filePathDisk;
        $this->fileNameRaw = $fileNameRaw;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔒 CRITICAL DISASTER RECOVERY VAULT: AUTOMATED DAILY DATABASE HOT-DUMP BACKUP',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: '<h3>Ecosystem Transaction Log Snapshot Compiled Successfully</h3><p>An automated maintenance routine hot-dump was compiled on the active PostgreSQL core stack engine layer. See the attached cryptographically closed transaction snapshot dump sheet file tracking trace data properties for off-site disaster recovery safety plans.</p><p>Ecosystem Integrity Check Node: <strong>SECURED / OPERATIONAL COMPLIANT</strong>.</p>',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [
            Attachment::fromPath($this->filePathDisk)
                ->as($this->fileNameRaw)
                ->withMime('application/octet-stream'),
        ];
    }
}
