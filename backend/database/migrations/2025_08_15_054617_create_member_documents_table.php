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
            $table->foreignId('member_profile_id')->constrained('member_profiles')
                ->onUpdate('restrict')
                ->onDelete('cascade');

            $table->string('document_type', 255); // e.g. "Medical Certificate"
            $table->string('file_path', 255)->nullable(); // uploaded copy
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending'); // review status
            $table->boolean('hard_copy_received')->default(false); // for physical submission
            $table->text('remarks')->nullable(); // feedback if rejected

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
