<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('member_profile_id')
                ->constrained('member_profiles')
                ->onUpdate('cascade')
                ->onDelete('cascade');

            // Fixed required files
            $table->string('barangay_indigency')->nullable();
            $table->string('medical_certificate')->nullable();
            $table->string('picture_2x2')->nullable();
            $table->string('birth_certificate')->nullable();
            $table->boolean('hard_copy_submitted')->nullable();
            
            // Optional remarks (e.g., "pending", "needs clearer copy")
            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_documents');
    }
};
