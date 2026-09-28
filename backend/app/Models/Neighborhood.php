<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Neighborhood extends Model
{
    use HasFactory;

    protected $fillable = ['label', 'sector_id'];

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    /**
     * The families living here.
     *
     * Matched on the name rather than an id: the family record carries the
     * neighborhood as text, which is what the widow list, the reports and
     * the printed card all want to show. Renaming a neighborhood therefore
     * has to carry the families with it, which is what the controller does
     * in a transaction rather than leaving the two to drift.
     */
    public function widows(): Builder
    {
        // The association's families. A عدة case lives somewhere too, but she
        // is not one of them yet and this count is what the reference screen
        // shows as "how many families are here".
        return Widow::query()->regular()->where('neighborhood', $this->label);
    }
}
