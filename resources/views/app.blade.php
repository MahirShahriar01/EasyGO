@php($settings = \App\Models\Setting::publicSettings())
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="{{ $settings['site_name'] }} — book hotels, flights, buses, tour packages and rental cars at the best price.">
    <meta name="theme-color" content="#0b5ed7">
    <meta property="og:title" content="{{ $settings['site_name'] }} — {{ $settings['site_tagline'] }}">
    <meta property="og:type" content="website">
    <title>{{ $settings['site_name'] }} — {{ $settings['site_tagline'] }}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        // Initial public settings, so the first paint already has branding & currency.
        window.__EASYGO__ = @json(['settings' => $settings, 'appUrl' => config('app.url')]);
        // Apply the saved theme before React mounts to avoid a light/dark flash.
        try { document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('easygo.theme') || 'light'); } catch (e) {}
    </script>
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
</head>
<body>
    <noscript>{{ $settings['site_name'] }} requires JavaScript to run.</noscript>
    <div id="app"></div>
</body>
</html>
