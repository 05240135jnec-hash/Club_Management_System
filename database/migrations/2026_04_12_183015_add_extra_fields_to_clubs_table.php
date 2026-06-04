<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->string('aim')->nullable()->after('description');
            $table->json('objectives')->nullable()->after('aim');
            $table->string('secretary')->nullable()->after('objectives');
        });
    }

    public function down(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn(['aim', 'objectives', 'secretary']);
        });
    }
};