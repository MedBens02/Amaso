<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The home screen's figures, shaped for whoever is asking.
 *
 * There is no ?role= parameter, on purpose: the sections come from the
 * signed-in account's own role, so nobody can ask for another role's
 * dashboard - in particular the accounts section, which is the superuser's.
 */
class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboard)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->dashboard->for($request->user())]);
    }
}
