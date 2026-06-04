<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('club_members', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('user_id');
            $table->timestamp('removed_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('club_members', function (Blueprint $table) {
            $table->dropColumn(['status', 'removed_at']);
        });
    }
};