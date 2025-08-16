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
        Schema::create('member_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('member_profile_id')
                ->constrained('member_profiles')
                ->onUpdate('restrict')
                ->onDelete('cascade');

            // ✅ renamed to snake_case and fixed nullable
            $table->string('barangay_indigency', 255)->nullable();
            $table->string('medical_certificate', 255)->nullable();
            $table->string('picture_2x2', 255)->nullable();
            $table->string('birth_certificate', 255)->nullable();

            $table->boolean('hard_copy_received')->default(false);
            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_documents');
    }
};
