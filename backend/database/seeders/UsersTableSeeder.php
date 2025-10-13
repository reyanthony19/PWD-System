<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\User;
use App\Models\MemberProfile;
use App\Models\AdminProfile;
use App\Models\StaffProfile;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin
        $admin = User::create([
            'username' => 'adminuser',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'status' => 'approved',
            'email_verified_at' => Carbon::now(),
            'password' => Hash::make('password123'),
            'remember_token' => Str::random(10),
        ]);

        // Create Admin Profile
        AdminProfile::create([
            'user_id' => $admin->id,
            'first_name' => 'Admin',
            'middle_name' => 'Super',
            'last_name' => 'User',
            'contact_number' => '09123456789',
            'birthdate' => '1990-01-01',
            'address' => '123 Admin Street',
        ]);

        // Barangay options - exactly as in your React form
        $barangays = [
            "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
            "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
            "Poblacion", "Taboc", "Tingalan"
        ];

        // Disability types matching the React form
        $disabilityTypes = [
            'physical' => 'Physical Disability',
            'mental_health' => 'Mental Health Disability',
            'sensory' => 'Sensory Disability',
            'neurological' => 'Neurological Disability',
            'developmental' => 'Developmental Disability',
            'chronic_health' => 'Chronic Health Condition',
            'other' => 'Other Disability'
        ];

        // Severity levels
        $severityLevels = ['mild', 'moderate', 'severe', 'profound'];

        // Monthly income ranges as actual numbers (for decimal column)
        $monthlyIncomeRanges = [
            0,           // no_income
            2500,        // below_5000
            7500,        // 5000_10000
            15000,       // 10000_20000
            25000,       // 20000_30000
            40000,       // 30000_50000
            60000        // above_50000
        ];

        // Blood types
        $bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];

        // Sex options
        $sexOptions = ['male', 'female', 'other'];

        // Guardian relationships
        $guardianRelationships = [
            'parent', 'spouse', 'child', 'sibling', 'grandparent', 
            'aunt_uncle', 'cousin', 'guardian', 'other'
        ];

        // Common Filipino surnames
        $surnames = [
            'Dela Cruz', 'Santos', 'Reyes', 'Gonzales', 'Ramos', 'Mendoza', 
            'Villanueva', 'Fernandez', 'Torres', 'Garcia', 'Aquino', 'Castro',
            'Ortiz', 'Silva', 'Mendoza', 'Gomez', 'Herrera', 'Romero', 'Navarro',
            'Rivera', 'Salazar', 'Villanueva', 'Alvarez', 'Lopez', 'Martinez'
        ];

        // Common Filipino first names
        $maleFirstNames = ['Juan', 'Pedro', 'Carlos', 'Miguel', 'Luis', 'Antonio', 'Jose', 'Ricardo', 'Roberto', 'Fernando'];
        $femaleFirstNames = ['Maria', 'Ana', 'Elena', 'Sofia', 'Carmen', 'Rosa', 'Isabel', 'Maricel', 'Teresa', 'Lourdes'];

        // Middle names
        $middleNames = ['Santos', 'Reyes', 'Cruz', 'Mendoza', 'Garcia', 'Rivera', 'Aquino', 'Lopez', 'Martinez', 'Navarro'];

        $members = [];
        $memberId = 1;

        // Create exactly 5 members for each barangay
        foreach ($barangays as $barangay) {
            for ($i = 1; $i <= 5; $i++) {
                $isMale = $i <= 3; // 3 males and 2 females per barangay
                $firstName = $isMale ? $maleFirstNames[array_rand($maleFirstNames)] : $femaleFirstNames[array_rand($femaleFirstNames)];
                $middleName = $middleNames[array_rand($middleNames)];
                $lastName = $surnames[array_rand($surnames)];
                $username = strtolower(str_replace(' ', '_', $firstName)) . '_' . strtolower(str_replace(' ', '_', $lastName)) . '_' . $barangay . $i;
                
                $disabilityType = array_rand($disabilityTypes);
                $severity = $severityLevels[array_rand($severityLevels)];
                $monthlyIncome = $monthlyIncomeRanges[array_rand($monthlyIncomeRanges)];
                $bloodType = $bloodTypes[array_rand($bloodTypes)];
                $sex = $isMale ? 'male' : 'female';
                
                $members[] = [
                    'username' => $username,
                    'email' => $username . '@example.com',
                    'role' => 'member',
                    'password' => 'password123',
                    'profile' => [
                        'first_name' => $firstName,
                        'middle_name' => $middleName,
                        'last_name' => $lastName,
                        'id_number' => 'M' . str_pad($memberId, 3, '0', STR_PAD_LEFT),
                        'contact_number' => '09' . str_pad(10000000 + $memberId, 8, '0', STR_PAD_LEFT),
                        'birthdate' => Carbon::now()->subYears(rand(18, 80))->subDays(rand(0, 365))->format('Y-m-d'),
                        'sex' => $sex,
                        'guardian_full_name' => ($isMale ? 'Mr. ' : 'Ms. ') . $lastName,
                        'guardian_relationship' => $guardianRelationships[array_rand($guardianRelationships)],
                        'guardian_contact_number' => '09' . str_pad(20000000 + $memberId, 8, '0', STR_PAD_LEFT),
                        'guardian_address' => $barangay . ' Proper',
                        'disability_type' => $disabilityType,
                        'severity' => $severity,
                        'monthly_income' => $monthlyIncome,
                        'barangay' => $barangay,
                        'address' => 'Purok ' . rand(1, 6) . ', ' . $barangay . ' Proper',
                        'blood_type' => $bloodType,
                        'sss_number' => rand(10, 99) . '-' . rand(1000000, 9999999) . '-' . rand(0, 9),
                        'philhealth_number' => rand(10, 99) . '-' . rand(100000000, 999999999) . '-' . rand(0, 9),
                        'dependent' => rand(0, 8),
                    ]
                ];
                $memberId++;
            }
        }

        // Loop through each member and create user & profile
        foreach ($members as $memberData) {
            $user = User::create([
                'username' => $memberData['username'],
                'email' => $memberData['email'],
                'role' => $memberData['role'],
                'status' => 'approved',
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make($memberData['password']),
                'remember_token' => Str::random(10),
            ]);

            // Create member profile
            MemberProfile::create(array_merge(
                ['user_id' => $user->id],
                $memberData['profile']
            ));
        }

        // Create staff members for each barangay
        $staffMembers = [];
        foreach ($barangays as $barangay) {
            $isMale = rand(0, 1) === 1;
            $firstName = $isMale ? $maleFirstNames[array_rand($maleFirstNames)] : $femaleFirstNames[array_rand($femaleFirstNames)];
            $lastName = $surnames[array_rand($surnames)];
            
            $staffMembers[] = [
                'username' => 'staff_' . strtolower(str_replace(' ', '_', $barangay)),
                'email' => 'staff.' . strtolower(str_replace(' ', '_', $barangay)) . '@example.com',
                'role' => 'staff',
                'password' => 'password123',
                'profile' => [
                    'first_name' => $firstName,
                    'middle_name' => $middleNames[array_rand($middleNames)],
                    'last_name' => $lastName,
                    'contact_number' => '09' . str_pad(30000000 + array_search($barangay, $barangays), 8, '0', STR_PAD_LEFT),
                    'birthdate' => Carbon::now()->subYears(rand(25, 50))->format('Y-m-d'),
                    'assigned_barangay' => $barangay,
                    'address' => $barangay . ' Center',
                ]
            ];
        }

        foreach ($staffMembers as $staffData) {
            $user = User::create([
                'username' => $staffData['username'],
                'email' => $staffData['email'],
                'role' => $staffData['role'],
                'status' => 'approved',
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make($staffData['password']),
                'remember_token' => Str::random(10),
            ]);

            StaffProfile::create(array_merge(
                ['user_id' => $user->id],
                $staffData['profile']
            ));
        }

        // Output summary
        $this->command->info('Successfully created:');
        $this->command->info('- 1 Admin user');
        $this->command->info('- ' . count($members) . ' Member users (5 per barangay)');
        $this->command->info('- ' . count($staffMembers) . ' Staff users (1 per barangay)');
        $this->command->info('Total: ' . (1 + count($members) + count($staffMembers)) . ' users');
        
        // Show barangay distribution
        $this->command->info('\nBarangay Distribution (5 members each):');
        foreach ($barangays as $barangay) {
            $this->command->info('- ' . $barangay . ': 5 members + 1 staff');
        }

        // Show sample member data
        $this->command->info('\nSample Member Data:');
        $sampleMember = $members[0]['profile'];
        $this->command->info('- Name: ' . $sampleMember['first_name'] . ' ' . $sampleMember['middle_name'] . ' ' . $sampleMember['last_name']);
        $this->command->info('- Barangay: ' . $sampleMember['barangay']);
        $this->command->info('- Disability: ' . $sampleMember['disability_type'] . ' (' . $sampleMember['severity'] . ')');
        $this->command->info('- Monthly Income: ₱' . number_format($sampleMember['monthly_income'], 2));
        $this->command->info('- Dependents: ' . $sampleMember['dependent']);
    }
}