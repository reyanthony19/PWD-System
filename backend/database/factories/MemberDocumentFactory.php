<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\MemberDocument;
use App\Models\MemberProfile;

class MemberDocumentFactory extends Factory
{
    protected $model = MemberDocument::class;

    public function definition(): array
    {
        return [
            'member_profile_id' => MemberProfile::factory(),
            'document_type' => $this->faker->randomElement([
                'Medical Certificate',
                'Birth Certificate',
                'ID Proof',
                'Vaccination Record',
                'Other'
            ]),
            'file_path' => $this->faker->optional()->filePath(),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'hard_copy_received' => $this->faker->boolean(30),
            'remarks' => $this->faker->optional()->sentence(),
        ];
    }
}
