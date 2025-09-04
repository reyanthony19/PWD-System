<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Benefits (Cash or Relief Goods)
        Schema::create('benefits', function (Blueprint $table) {
            $table->id();
            $table->string('name');                           // e.g., "Cash Assistance", "Relief Goods"
            $table->enum('type', ['cash', 'relief']);         // identifies type of benefit

            // Cash-related fields
            $table->decimal('budget_amount', 12, 2)->nullable(); // total budget for cash benefits

            // Relief-related fields
            $table->integer('budget_quantity')->nullable();   // total number of goods available
            $table->string('unit')->nullable();               // e.g., "pack", "kg", "box"

            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // 2) Benefit Records (tracks distributions per member)
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

            // Staff/admin who scanned the distribution
            $table->foreignId('scanned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Distribution tracking
            $table->decimal('amount_received', 12, 2)->nullable(); // for cash
            $table->integer('quantity_received')->nullable();      // for relief goods

            $table->enum('status', ['pending', 'claimed', 'absent'])->default('pending');
            $table->timestamp('claimed_at')->nullable();
            $table->text('remarks')->nullable();                  // e.g., "Door-to-door delivery"
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
