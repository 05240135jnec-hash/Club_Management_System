<?php

return [

    'paths' => ['api/*', 'storage/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://10.201.220.251:8000',
        'http://10.201.220.251:5173',
        'https://subwoofer-startling-swampland.ngrok-free.app',
        'https://subwoofer-startling-swampland.ngrok-free.dev',
        'https://magnitude-scrap-factoid.ngrok-free.dev',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];