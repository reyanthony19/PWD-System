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

        AdminProfile::create([
            'user_id' => $admin->id,
            'first_name' => 'Admin',
            'middle_name' => 'Super',
            'last_name' => 'User',
            'contact_number' => '09123456789',
            'birthdate' => '1990-01-01',
            'address' => '123 Admin Street',
        ]);

        // Create Staff

    }
}
