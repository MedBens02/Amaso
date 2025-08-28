<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
    ];

    public function widows(): BelongsToMany
    {
        return $this->belongsToMany(Widow::class, 'widow_skill', 'skill_id', 'widow_id');
    }
}