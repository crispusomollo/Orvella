<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Vite::prefetch(concurrency: 3);
    
        // Bind your autonomous model observer using precise target namespaces
        //\App\Models\Batch::observe(\App\Observers\BatchObserver::class);

        // Bind your global security authentication tracking ecosystem
        \Illuminate\Support\Facades\Event::subscribe(\App\Listeners\AuthEventSubscriber::class);
    }


}
