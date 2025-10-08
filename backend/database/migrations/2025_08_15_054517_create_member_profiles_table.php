<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->onUpdate('cascade')
                ->onDelete('cascade');

            $table->string('first_name', 255);
            $table->string('middle_name', 255)->nullable();
            $table->string('last_name', 255);
            $table->string('id_number')->unique();

            $table->string('contact_number')->nullable();
            $table->date('birthdate');
            $table->string('sex', 50);

            $table->string('guardian_full_name')->nullable();
            $table->string('guardian_relationship')->nullable();
            $table->string('guardian_contact_number', 50)->nullable();
            $table->string('guardian_address')->nullable();

            $table->string('disability_type');
            $table->string('barangay');
            $table->string('address');
            $table->string('blood_type')->nullable();
            $table->string('sss_number')->nullable();
            $table->string('philhealth_number')->nullable();

            $table->string('severity')->nullable();
            $table->string(column: 'dependent')->nullable();
            $table->decimal('monthly_income', 10, 2)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_profiles');
    }
};
