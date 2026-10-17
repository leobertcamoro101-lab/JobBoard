<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

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

        // Login: 5 tries a minute per email+IP, and 20 a minute per IP overall
        RateLimiter::for('auth-login', fn (Request $r) => [
            Limit::perMinute(5)->by(strtolower((string) $r->input('email')) . '|' . $r->ip()),
            Limit::perMinute(20)->by($r->ip()),
        ]);

        // Signup step 1: 5 a minute per IP
        RateLimiter::for('auth-register', fn (Request $r) => Limit::perMinute(5)->by($r->ip()));

        // Signup step 2 (where the code is guessed): 5 tries per 15 minutes per email+IP
        RateLimiter::for('auth-confirm', fn (Request $r) =>
            Limit::perMinutes(15, 5)->by(strtolower((string) $r->input('email')) . '|' . $r->ip()));

        // Resend the code: 2 a minute per email+IP
        RateLimiter::for('auth-resend', fn (Request $r) =>
            Limit::perMinute(2)->by(strtolower((string) $r->input('email')) . '|' . $r->ip()));
    }
}
