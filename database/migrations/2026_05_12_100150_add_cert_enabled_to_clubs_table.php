<?php
// database/migrations/xxxx_add_cert_enabled_to_clubs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::table('clubs', function (Blueprint $table) {
            $table->boolean('cert_enabled')->default(true)->after('name');
        });
    }
    public function down() {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn('cert_enabled');
        });
    }
};