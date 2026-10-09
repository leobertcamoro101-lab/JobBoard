<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;

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
        //Enable lazy loading prevention
        Model::preventLazyLoading(! $this->app->isProduction());
        
        $link = public_path('storage');

        if (! file_exists($link) && ! is_link($link)) {
            File::link(storage_path('app/public'), $link);
        }
    }
}
