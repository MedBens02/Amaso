<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // This backend is API-only - there is no "login" web route to send
        // a guest to. Without this, Laravel's default guest redirect
        // (route('login')) throws RouteNotFoundException for any
        // unauthenticated request that doesn't send an Accept: application/
        // json header, surfacing as a 500 instead of a 401.
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\App\Exceptions\BusinessRuleException $e) {
            return response()->json(['message' => $e->getMessage()], $e->status);
        });

        // This backend is API-only (no web login route exists), so an
        // unauthenticated request must always get a JSON 401 - never
        // Laravel's default redirect-to-login-route fallback, which would
        // throw (no such route) and surface as a 500.
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e) {
            return response()->json(['message' => 'يجب تسجيل الدخول للوصول إلى هذا المورد'], 401);
        });
    })->create();
