<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        \DB::statement("ALTER TABLE reports MODIFY COLUMN sent_to ENUM('dsa','me','advisor') NULL");
    }

    public function down(): void
    {
        \DB::statement("ALTER TABLE reports MODIFY COLUMN sent_to ENUM('dsa','me') NULL");
    }
};