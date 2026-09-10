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
    Schema::create('job_listings', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->string('company');
        $table->string('company_logo')->nullable();
        $table->string('location');
        $table->enum('type', ['full-time', 'part-time', 'remote', 'contract'])->default('full-time');
        $table->string('salary_min')->nullable();
        $table->string('salary_max')->nullable();
        $table->string('currency')->default('USD');
        $table->text('description');
        $table->text('requirements')->nullable();
        $table->string('apply_email');
        $table->boolean('is_active')->default(true);
        $table->string('category')->default('Engineering');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_listings');
    }
};
