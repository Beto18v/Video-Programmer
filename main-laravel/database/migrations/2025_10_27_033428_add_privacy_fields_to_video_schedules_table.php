<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('video_schedules', function (Blueprint $table) {
            $table->boolean('for_kids')->default(false)->after('action_parameters');
            $table->boolean('age_restricted')->default(false)->after('for_kids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('video_schedules', function (Blueprint $table) {
            $table->dropColumn(['for_kids', 'age_restricted']);
        });
    }
};
