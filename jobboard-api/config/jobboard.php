<?php

return [
    // Set REQUIRE_EMAIL_CONFIRMATION=false to skip the emailed code during signup.
    'require_email_confirmation' => env('REQUIRE_EMAIL_CONFIRMATION', true),
];