<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class LowStockAlertEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $lowStockProducts;

    /**
     * Create a new mailable instance payload.
     */
    public function __construct(Collection $lowStockProducts)
    {
        $this->lowStockProducts = $lowStockProducts;
    }

    /**
     * Get the message envelope configurations.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'CRITICAL ALERT: Pharmacy Low Stock Warning Thresholds Breached',
        );
    }

    /**
     * Get the message content definition using inline text composition markup.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtmlAlertContent(),
        );
    }

    /**
     * Construct a clean, styled HTML layout display matrix for email client screens.
     */
    protected function buildHtmlAlertContent(): string
    {
        $html = "<div style='font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #fee2e2; border-radius: 12px;'>";
        $html .= "<h2 style='color: #dc2626;'>Pharmacy Automated Operations Command</h2>";
        $html .= "<p>The system inventory background worker task has detected medications running beneath safety reorder parameters:</p>";
        $html .= "<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>";
        $html .= "<thead style='background-color: #f8fafc;'><tr><th style='padding: 8px; text-align: left; border-bottom: 2px solid #e2e8f0;'>Medication Formula</th><th style='padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;'>Live Count</th><th style='padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;'>Min Safety Level</th></tr></thead><tbody>";

        foreach ($this->lowStockProducts as $prod) {
            $html .= "<tr>";
            $html .= "<td style='padding: 8px; border-bottom: 1px solid #f1f5f9;'><strong>{$prod->name}</strong> <small style='color:#64748b;'>({$prod->generic_name})</small></td>";
            $html .= "<td style='padding: 8px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #dc2626; font-weight: bold;'>{$prod->total_stock} Units</td>";
            $html .= "<td style='padding: 8px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #64748b;'>{$prod->reorder_level} Units</td>";
            $html .= "</tr>";
        }

        $html .= "</tbody></table>";
        $html .= "<p style='margin-top: 20px; font-size: 11px; color: #94a3b8;'>Sourced autonomously via PostgreSQL Database Registers Tracker. Please issue distribution restock orders immediately.</p>";
        $html .= "</div>";

        return $html;
    }
}

