<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->string('role')->default('advisor'); // 'advisor' or 'secretary'
            $table->string('title');
            $table->string('type'); // Annual Report, Semester Report, etc.
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_size')->nullable();
            $table->enum('sent_to', ['dsa', 'me'])->default('me');
            $table->boolean('forwarded_to_dsa')->default(false);
            $table->timestamp('forwarded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};