<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class CashService
{
    /**
     * Get the current cash amount from the v_current_cash view
     * 
     * @return float
     */
    public function getCurrentCash(): float
    {
        $result = DB::select('SELECT current_cash FROM v_current_cash LIMIT 1');
        
        return $result ? (float) $result[0]->current_cash : 0.00;
    }
    
    /**
     * Get current cash as a formatted decimal
     * 
     * @return string
     */
    public function getCurrentCashFormatted(): string
    {
        return number_format($this->getCurrentCash(), 2);
    }
}