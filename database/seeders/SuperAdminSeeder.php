<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@jnec.edu.bt'],
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('Admin@1234'),
                'role'     => 'super_admin',
                'status'   => 'active',
            ]
        );
    }
}