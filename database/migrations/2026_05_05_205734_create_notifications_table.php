<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // who receives it
            $table->string('type');           // announcement, report, attendance_clash, member_joined, secretary_assigned, work_plan, audit_feedback, co_advisor_accepted
            $table->string('title');          // short title
            $table->text('message');          // full message
            $table->string('club_name')->nullable(); // which club
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};