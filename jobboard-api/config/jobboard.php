<?php

return [
    // Set REQUIRE_EMAIL_CONFIRMATION=false to skip the emailed code during signup.
    'require_email_confirmation' => env('REQUIRE_EMAIL_CONFIRMATION', true),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
];