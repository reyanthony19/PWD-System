<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            // Member who attended
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Event reference
            $table->foreignId('event_id')
                ->constrained('events')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Staff/Admin who scanned the QR
            $table->foreignId('scanned_by')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();

            // Prevent duplicate attendance per event
            $table->unique(['user_id', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
