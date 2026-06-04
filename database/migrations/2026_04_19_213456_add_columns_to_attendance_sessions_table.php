<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->foreignId('club_id')->after('id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('created_by')->after('date')->constrained('users')->onDelete('cascade');
            $table->unique(['club_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->dropForeign(['club_id']);
            $table->dropForeign(['created_by']);
            $table->dropUnique(['club_id', 'date']);
            $table->dropColumn(['club_id', 'created_by']);
        });
    }
};