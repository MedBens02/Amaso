<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Kafil;
use App\Models\KafilSponsorship;
use Illuminate\Support\Facades\DB;

class KafilService
{
    /**
     * Convert a kafil back to a plain donor: drop all sponsorships,
     * clear the donor flag and delete the kafil record.
     */
    public function removeKafilStatus(Kafil $kafil): void
    {
        DB::transaction(function () use ($kafil) {
            KafilSponsorship::where('kafil_id', $kafil->id)->delete();

            if ($kafil->donor) {
                $kafil->donor->update([
                    'is_kafil' => false,
                    'monthly_pledge' => null,
                ]);
            }

            $kafil->delete();
        });
    }

    /**
     * Sponsor a widow. Exceeding the monthly pledge is allowed but reported
     * back as a warning for the UI to display.
     *
     * @return array{sponsorship: KafilSponsorship, warning: ?array}
     */
    public function createSponsorship(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $kafil = Kafil::findOrFail($data['kafil_id']);

            $alreadySponsors = KafilSponsorship::where('kafil_id', $data['kafil_id'])
                ->where('widow_id', $data['widow_id'])
                ->exists();

            if ($alreadySponsors) {
                throw new BusinessRuleException('يوجد كفالة سابقة لهذه الأرملة من نفس الكفيل', 422);
            }

            $totalSponsored = KafilSponsorship::where('kafil_id', $data['kafil_id'])->sum('amount');
            $newTotal = $totalSponsored + $data['amount'];

            $sponsorship = KafilSponsorship::create([
                'kafil_id' => $data['kafil_id'],
                'widow_id' => $data['widow_id'],
                'amount' => $data['amount'],
            ]);

            $warning = $newTotal > $kafil->monthly_pledge ? [
                'message' => 'تحذير: إجمالي مبالغ الكفالات يتجاوز التعهد الشهري',
                'monthly_pledge' => $kafil->monthly_pledge,
                'total_sponsored' => $newTotal,
                'excess_amount' => $newTotal - $kafil->monthly_pledge,
            ] : null;

            return ['sponsorship' => $sponsorship, 'warning' => $warning];
        });
    }
}
