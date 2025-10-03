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

        // Create Members
        $members = [
            [
                'username' => 'member1',
                'email' => 'member1@example.com',
                'role' => 'member',
                'password' => 'password123',
                'profile' => [
                    'first_name' => 'John',
                    'middle_name' => 'Doe',
                    'last_name' => 'Smith',
                    'id_number' => 'M001',
                    'contact_number' => '09123456701',
                    'birthdate' => '2000-01-01',
                    'sex' => 'Male',
                    'guardian_full_name' => 'Jane Smith',
                    'guardian_relationship' => 'Mother',
                    'guardian_contact_number' => '09123456701',
                    'guardian_address' => '123 Member St.',
                    'disability_type' => 'None',
                    'barangay' => 'Barangay 1',
                    'address' => '123 Member St.',
                    'blood_type' => 'O+',
                    'sss_number' => '123-456-7890',
                    'philhealth_number' => 'PH12345678',
                ]
            ],
            [
                'username' => 'member2',
                'email' => 'member2@example.com',
                'role' => 'member',
                'password' => 'password123',
                'profile' => [
                    'first_name' => 'Alice',
                    'middle_name' => 'Marie',
                    'last_name' => 'Johnson',
                    'id_number' => 'M002',
                    'contact_number' => '09123456702',
                    'birthdate' => '1999-05-15',
                    'sex' => 'Female',
                    'guardian_full_name' => 'Bob Johnson',
                    'guardian_relationship' => 'Father',
                    'guardian_contact_number' => '09123456702',
                    'guardian_address' => '456 Member St.',
                    'disability_type' => 'Visual Impairment',
                    'barangay' => 'Barangay 2',
                    'address' => '456 Member St.',
                    'blood_type' => 'A+',
                    'sss_number' => '987-654-3210',
                    'philhealth_number' => 'PH98765432',
                ]
            ],
            // Add more members as needed
        ];

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
    }
}
