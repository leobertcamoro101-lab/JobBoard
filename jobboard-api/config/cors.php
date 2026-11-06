<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],

    // Comma-separated list. In production set CORS_ALLOWED_ORIGINS to the
    // deployed frontend only, so localhost is not trusted there.
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env(
            'CORS_ALLOWED_ORIGINS',
            'http://localhost:5173,https://job-board-rho-green.vercel.app'
        ))
    ))),

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,

    // Bearer-token auth, so no cookies cross origins.
    'supports_credentials' => false,
];
