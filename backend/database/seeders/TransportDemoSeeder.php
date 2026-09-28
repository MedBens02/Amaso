<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\OrphanEnrollment;
use App\Models\TransportMonth;
use App\Models\TransportSupport;
use App\Services\TransportSettlementService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Demo transport, seedable on its own.
 *
 * Split out of DemoDataSeeder because a server that already holds demo
 * families cannot re-run that one: it inserts rather than upserts, and a
 * second pass collides on the first bank account it tries to create. When
 * transport arrived, every existing demo install was left with the tables
 * and nothing in them, and no way to fill them short of wiping the
 * database. This is that way.
 *
 * Two guards, because this writes invented records:
 *
 *   - it refuses to run where any family is not demo data, on the same
 *     DEMO-prefix marker the money harnesses use. A real install must never
 *     acquire invented bus riders.
 *   - it refuses to run twice, because it inserts rather than upserts and
 *     the second pass would double the roster and halve everybody's share.
 *     --fresh clears the transport tables first, for re-running it after a
 *     change to the shape of the demo.
 */
class TransportDemoSeeder extends Seeder
{
    public function run(bool $silent = false, bool $fresh = false): void
    {
        // `db:seed --class=...` passes nothing through to run(), so the flag
        // also comes from the environment - which is how seed-demo.sh sets
        // it, having no other way to reach in.
        $fresh = $fresh || filter_var(env('SEED_TRANSPORT_FRESH', false), FILTER_VALIDATE_BOOLEAN);

        $say = function (string $message) use ($silent) {
            if (! $silent && $this->command !== null) {
                $this->command->info($message);
            }
        };

        $families = DB::table('widows')->count();
        $real = DB::table('widows')->where('national_id', 'not like', 'DEMO%')->count();

        if ($families > 0 && $real > 0) {
            $say("REFUSED: {$real} family record(s) are not demo data. This seeder writes invented records and will not touch a real database.");

            return;
        }

        if ($fresh) {
            // Children first: the lines hang off both, and the months hang
            // off nothing, so this order never trips a foreign key.
            DB::table('transport_month_lines')->delete();
            DB::table('transport_months')->delete();
            DB::table('transport_support')->delete();
            $say('Cleared the existing transport records.');
        }

        if (TransportSupport::query()->exists()) {
            $say('Transport data is already present - nothing seeded. Pass --fresh to replace it.');

            return;
        }

        $currentYear = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::orderByDesc('start_year')->first();

        if ($currentYear === null) {
            $say('No academic year on file - seed the education data first.');

            return;
        }

        $this->seed($currentYear);

        $say(sprintf(
            'Transport seeded: %d on the bus, %d on an allowance, %d month(s).',
            TransportSupport::where('mode', TransportSupport::MODE_BUS)->count(),
            TransportSupport::where('mode', TransportSupport::MODE_ALLOWANCE)->count(),
            TransportMonth::count(),
        ));
    }

    /**
     * Getting the children to the centre.
     *
     * One bus and a monthly pot, which is how the association actually does
     * it: the fuel and the driver's fee are totalled at the end of the month
     * and divided among whoever rode consistently. A handful of children
     * live beyond the bus and are paid per attendance instead.
     *
     * Three months are seeded in different states - one settled on both
     * halves, one with only the bus paid, and one untouched - so the screens
     * have each case to show rather than only the extremes.
     */
    private function seed(AcademicYear $currentYear): void
    {
        $settlement = app(TransportSettlementService::class);

        $enrollments = OrphanEnrollment::where('academic_year_id', $currentYear->id)
            ->orderBy('id')
            ->get();

        if ($enrollments->isEmpty()) {
            return;
        }

        // Roughly half the children ride; a few of those who do not are far
        // enough out to be paid their own way instead.
        foreach ($enrollments as $index => $enrollment) {
            if ($index % 2 === 0) {
                TransportSupport::create([
                    'enrollment_id' => $enrollment->id,
                    'mode' => TransportSupport::MODE_BUS,
                    'pickup_point' => ['أمام المسجد', 'محطة الحافلات', 'أمام الفرن', 'ساحة الحي'][$index % 4],
                    'start_date' => $currentYear->start_year . '-09-15',
                    'status' => TransportSupport::STATUS_ACTIVE,
                ]);
            } elseif ($index % 7 === 3) {
                TransportSupport::create([
                    'enrollment_id' => $enrollment->id,
                    'mode' => TransportSupport::MODE_ALLOWANCE,
                    'allowance_rate' => [10, 12, 15][$index % 3],
                    'start_date' => $currentYear->start_year . '-09-15',
                    'status' => TransportSupport::STATUS_ACTIVE,
                    'notes' => 'يسكن خارج مسار الحافلة',
                ]);
            }
        }

        // Months run from the start of the school year to the month we are in.
        $opened = Carbon::create($currentYear->start_year, 10, 1)->startOfMonth();
        $costs = [
            ['fuel' => 1850, 'driver' => 2000, 'other' => 0],
            ['fuel' => 1920, 'driver' => 2000, 'other' => 340],
            ['fuel' => 1780, 'driver' => 2000, 'other' => 0],
        ];

        foreach ($costs as $position => $cost) {
            $month = TransportMonth::create([
                'academic_year_id' => $currentYear->id,
                'period_month' => $opened->copy()->addMonths($position)->toDateString(),
                'fuel_cost' => $cost['fuel'],
                'driver_cost' => $cost['driver'],
                'other_cost' => $cost['other'],
            ]);

            $settlement->syncLines($month);

            // Nobody rides every single trip. The bus ran 20 times that
            // month; most children made nearly all of them, a few missed a
            // stretch, and one did not ride at all - which is the spread the
            // pro-rata split exists to handle. The allowance children are
            // given the number of times they actually turned up.
            foreach ($month->lines()->get() as $lineIndex => $line) {
                if ($line->mode === TransportSupport::MODE_BUS) {
                    $line->attendances = ($lineIndex + $position) % 9 === 0
                        ? 0
                        : 20 - (($lineIndex * 3 + $position) % 7);
                } else {
                    $line->attendances = 6 + (($lineIndex + $position) % 5);
                }
                $line->save();
            }

            $settlement->recalculate($month);

            // The first month is settled on both halves, the second only on
            // the bus, and the third is untouched - so the screens have one
            // of each state to show rather than only the extremes.
            $endOfMonth = $month->period_month->copy()->endOfMonth();

            if ($position === 0) {
                $month->update(['bus_settled_at' => $endOfMonth, 'allowance_settled_at' => $endOfMonth]);
            } elseif ($position === 1) {
                $month->update(['bus_settled_at' => $endOfMonth]);
            }
        }
    }
}
