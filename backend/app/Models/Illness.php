<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Illness extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'is_chronic',
    ];

    protected $casts = [
        'is_chronic' => 'boolean',
    ];

    public function widows(): BelongsToMany
    {
        return $this->belongsToMany(Widow::class, 'widow_illnesses', 'illness_id', 'widow_id');
    }
}