<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\AdminProfile;
use App\Models\StaffProfile;
use App\Models\MemberProfile;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Optional: call your manual Users seeder
        $this->call(UsersTableSeeder::class);

        // Admin with profile
        User::factory()->state([
            'username' => 'factoryadmin',
            'role' => 'admin',
            'status' => 'approved',
        ])->has(AdminProfile::factory())->create();

      
    }
}
