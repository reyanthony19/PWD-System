<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Benefits (cash or relief goods)
        Schema::create('benefits', function (Blueprint $table) {
            $table->id();
            $table->string('name');                          // e.g., "Cash Assistance", "Relief Goods"
            $table->enum('type', ['cash', 'relief'])->default('cash');
            $table->decimal('amount', 12, 2)->nullable();    // for cash benefits
            $table->string('unit')->nullable();              // e.g., "pack" for relief goods
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // 2) Benefit records (tracks who received)
        Schema::create('benefit_records', function (Blueprint $table) {
            $table->id();

            // Member who received the benefit
            $table->foreignId('member_id')
                ->constrained('member_profiles')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Reference to the benefit
            $table->foreignId('benefit_id')
                ->constrained('benefits')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Staff/admin who processed the distribution
            $table->foreignId('processed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('status', ['pending', 'claimed', 'absent'])->default('pending');
            $table->timestamp('claimed_at')->nullable();
            $table->text('remarks')->nullable();           // e.g., "Door-to-door delivery"
            $table->timestamps();

            // Prevent duplicate record per member per benefit
            $table->unique(['member_id', 'benefit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benefit_records');
        Schema::dropIfExists('benefits');
    }
};
