<?php

namespace Database\Factories;

use App\Models\MemberProfile;
use App\Models\MemberDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

class MemberProfileFactory extends Factory
{
    protected $model = MemberProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => null, // Will be set when attached to a User factory
            'first_name' => $this->faker->firstName(),
            'middle_name' => $this->faker->optional()->firstName(),
            'last_name' => $this->faker->lastName(),
            'id_number' => strtoupper($this->faker->bothify('ID-####')),
            'guardian' => $this->faker->optional()->name(), // ✅ New guardian field
            'birthdate' => $this->faker->date(),
            'sex' => $this->faker->randomElement(['male', 'female']),
            'disability_type' => $this->faker->word(),
            'barangay' => $this->faker->word(),
            'address' => $this->faker->address(),
            'blood_type' => $this->faker->randomElement(['A', 'B', 'AB', 'O']),
            'sss_number' => $this->faker->optional()->numerify('##-#######-#'),
            'philhealth_number' => $this->faker->optional()->numerify('##-#########-#'),
            'qr_code' => strtoupper($this->faker->bothify('QR-####')),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (MemberProfile $profile) {
            // Automatically create 3 documents for each profile
            MemberDocument::factory(3)->create([
                'member_profile_id' => $profile->id,
            ]);
        });
    }
}
