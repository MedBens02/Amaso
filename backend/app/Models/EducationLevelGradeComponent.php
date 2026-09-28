<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One part of a level's year mark - what it is called and what it is worth.
 *
 * The scheme a level carries is just a list of these, and their weights add
 * up to 100. A registration marked on this level gets a row per component
 * with the weight copied onto it, so marking a child is filling in boxes
 * somebody else already labelled and weighted.
 */
class EducationLevelGradeComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'education_level_id',
        'label',
        'weight',
        'sort_order',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    /** The two halves of an ordinary school year, which most levels use. */
    public const DEFAULT_SCHEME = [
        ['label' => 'الأسدس الأول', 'weight' => 50],
        ['label' => 'الأسدس الثاني', 'weight' => 50],
    ];

    /**
     * Give any of these levels that has no scheme the ordinary one.
     *
     * Called from the three places a level can come into existence - the
     * migration that backfilled the levels already there, the reference
     * seeder that plants them on a fresh install, and the screen where an
     * administrator adds one. A model event would have covered only the
     * last: the seeder inserts through the query builder, which fires none.
     *
     * Idempotent, so running it again over a level somebody has since
     * re-weighted leaves their scheme alone.
     */
    public static function ensureDefaultFor(iterable $levelIds): int
    {
        $ids = collect($levelIds)->filter()->unique();

        if ($ids->isEmpty()) {
            return 0;
        }

        $withScheme = self::whereIn('education_level_id', $ids)
            ->distinct()
            ->pluck('education_level_id');

        $missing = $ids->diff($withScheme);
        $now = now();
        $rows = [];

        foreach ($missing as $levelId) {
            foreach (self::DEFAULT_SCHEME as $order => $component) {
                $rows[] = [
                    'education_level_id' => $levelId,
                    'label' => $component['label'],
                    'weight' => $component['weight'],
                    'sort_order' => $order,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($rows !== []) {
            self::insert($rows);
        }

        return $missing->count();
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(OrphansEducationLevel::class, 'education_level_id');
    }

    /**
     * Whether a set of components is the plain two-semester year.
     *
     * The registrations table keeps its two quick-entry columns for levels
     * that are, since that is nearly the whole school and typing into a
     * table beats opening a dialog forty times. A level with a scheme of its
     * own cannot be two columns, so it is sent to the dialog instead.
     *
     * @param  iterable<int, array{label: string, weight: mixed}|self>  $components
     */
    public static function isPlainSemesters(iterable $components): bool
    {
        $seen = [];

        foreach ($components as $component) {
            $label = is_array($component) ? $component['label'] : $component->label;
            $weight = (float) (is_array($component) ? $component['weight'] : $component->weight);
            $seen[] = ['label' => $label, 'weight' => $weight];
        }

        if (count($seen) !== count(self::DEFAULT_SCHEME)) {
            return false;
        }

        foreach (self::DEFAULT_SCHEME as $index => $expected) {
            if ($seen[$index]['label'] !== $expected['label']
                || abs($seen[$index]['weight'] - $expected['weight']) > 0.001) {
                return false;
            }
        }

        return true;
    }
}
