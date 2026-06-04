<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['super_admin', 'advisor', 'co_advisor', 'secretary', 'student'])->default('student');
            $table->enum('status', ['active', 'pending', 'inactive', 'rejected'])->default('active');
            $table->string('staff_id')->nullable();
            $table->string('department')->nullable();
            $table->string('student_id')->nullable();
            $table->string('course')->nullable();
            $table->string('year')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};