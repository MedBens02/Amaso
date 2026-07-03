<?php

namespace App\Services;

use App\Models\Donor;
use App\Models\Kafil;
use App\Models\KafilSponsorship;
use Illuminate\Support\Facades\DB;

/**
 * Keeps the donors table and the linked kafil record in sync: a donor
 * flagged is_kafil owns a kafil row (with monthly pledge and optional
 * initial sponsorship); dropping the flag removes the kafil record.
 */
class DonorService
{
    public function create(array $data): Donor
    {
        return DB::transaction(function () use ($data) {
            $donor = Donor::create([
                ...$this->donorAttributes($data),
                'is_kafil' => $data['is_kafil'] ?? false,
            ]);

            if ($data['is_kafil'] ?? false) {
                $this->createKafilFor($donor, $data);
            }

            return $donor;
        });
    }

    public function update(Donor $donor, array $data): Donor
    {
        return DB::transaction(function () use ($donor, $data) {
            $wasKafil = $donor->is_kafil;
            $isNowKafil = $data['is_kafil'] ?? false;

            $donor->update([
                ...$this->donorAttributes($data),
                'is_kafil' => $isNowKafil,
            ]);

            if (!$wasKafil && $isNowKafil) {
                if (!Kafil::where('donor_id', $donor->id)->exists()) {
                    $this->createKafilFor($donor, $data);
                }
            } elseif ($wasKafil && !$isNowKafil) {
                $this->removeKafilFor($donor);
            } elseif ($wasKafil && $isNowKafil && $donor->kafil) {
                $donor->kafil->update([
                    ...$this->donorAttributes($data),
                    'monthly_pledge' => $data['monthly_pledge'] ?? null,
                ]);

                // The single-widow update flow replaces any existing sponsorships.
                $donor->kafil->sponsorships()->delete();
                if (!empty($data['widow_id'])) {
                    KafilSponsorship::create([
                        'kafil_id' => $donor->kafil->id,
                        'widow_id' => $data['widow_id'],
                        'amount' => $data['monthly_pledge'] ?? 0,
                    ]);
                }
            }

            return $donor;
        });
    }

    public function delete(Donor $donor): void
    {
        DB::transaction(function () use ($donor) {
            $this->removeKafilFor($donor);
            $donor->delete();
        });
    }

    private function createKafilFor(Donor $donor, array $data): void
    {
        $kafil = Kafil::create([
            ...$this->donorAttributes($data),
            'donor_id' => $donor->id,
            'monthly_pledge' => $data['monthly_pledge'] ?? null,
        ]);

        if (!empty($data['widow_id'])) {
            KafilSponsorship::create([
                'kafil_id' => $kafil->id,
                'widow_id' => $data['widow_id'],
                'amount' => $data['monthly_pledge'] ?? 0,
            ]);
        }
    }

    private function removeKafilFor(Donor $donor): void
    {
        if ($donor->kafil) {
            $donor->kafil->sponsorships()->delete();
            $donor->kafil->delete();
        }
    }

    private function donorAttributes(array $data): array
    {
        return [
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
        ];
    }
}
