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

        // Staff with profile
        User::factory()->state([
            'username' => 'factorystaff',
            'role' => 'staff',
            'status' => 'approved',
        ])->has(StaffProfile::factory())->create();

        // 5 members with profiles and 3 documents each
        User::factory(5)->state([
            'role' => 'member',
            'status' => 'pending',
        ])->create()
          ->each(function ($user) {
              MemberProfile::factory()->create([
                  'user_id' => $user->id, // important to avoid NULL error
              ]);
              // Documents are automatically created in MemberProfileFactory
          });
    }
}
