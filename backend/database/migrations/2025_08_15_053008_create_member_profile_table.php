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
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->string('first_name', 255);
            $table->string('middle_name', 255)->nullable();
            $table->string('last_name', 255);
            $table->string('id_number')->unique();
            $table->string('contact_number')->nullable();
            $table->date('birthdate');
            $table->string('sex', 255);
            $table->string('guardian_full_name', 255)->nullable();
            $table->string('guardian_relationship', 255)->nullable(); // e.g., Parent, Sibling, Caregiver
            $table->string('guardian_contact_number', 50)->nullable();
            $table->string('guardian_address', 255)->nullable();
            $table->string('disability_type', 255);
            $table->string('barangay', 255);
            $table->string('address', 255);
            $table->string('blood_type', 255)->nullable();
            $table->string('sss_number', 255)->nullable();
            $table->string('philhealth_number', 255)->nullable();
            $table->string('qr_code', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_profile');
    }
};
