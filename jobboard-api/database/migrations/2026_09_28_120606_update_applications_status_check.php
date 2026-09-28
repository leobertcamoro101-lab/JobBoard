<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('applications')->where('status', 'shortlisted')->update(['status' => 'reviewed']);

        DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
        DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected'))");
    }

    public function down(): void
    {
        DB::table('applications')->where('status', 'accepted')->update(['status' => 'shortlisted']);

        DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
        DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected'))");
    }
};