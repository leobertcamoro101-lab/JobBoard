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
    Schema::create('applications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('job_id')->constrained('job_listings')->onDelete('cascade');
        $table->string('name');
        $table->string('email');
        $table->string('phone')->nullable();
        $table->string('linkedin')->nullable();
        $table->string('portfolio')->nullable();
        $table->text('cover_letter');
        $table->string('resume_url')->nullable();
        $table->enum('status', ['pending', 'reviewed', 'shortlisted', 'rejected'])->default('pending');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
