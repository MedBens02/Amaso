<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Who changed what, and when.
     *
     * The association's books and its family files are both things people
     * have to be able to answer questions about months later - who approved
     * this expense, who edited this family's file, who changed the kafala
     * split percentages. Until now the only trace of any of it was
     * created_by on a few tables, which says who first entered a row and
     * nothing about who touched it afterwards.
     *
     * One row per change, written by an observer on every domain model, so
     * coverage does not depend on remembering to log at each write site.
     *
     * Deliberately append-only: no updated_at, nothing in the app writes to
     * a row after it is inserted, and there is no endpoint that edits or
     * deletes one. A log that can be edited answers no questions.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // Nullable, and paired with a name snapshot: the log has to
            // still read correctly after an account is deleted, and changes
            // made by a console command have no user at all.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name', 150)->nullable();

            // created / updated / deleted / restored, plus the domain
            // actions the generic ones read badly as - approved, rejected,
            // transferred, closed. See AuditLogger::ACTIONS.
            $table->string('action', 40);

            // The model's short class name, e.g. "Income". Stored without
            // the namespace so the value survives the class moving.
            $table->string('entity_type', 60);
            $table->unsignedBigInteger('entity_id')->nullable();

            // What the record was called at the time. Snapshotted because
            // the point of a log is to read correctly after the record it
            // describes has been renamed or deleted.
            $table->string('entity_label', 200)->nullable();

            // { field: { from, to } }, already filtered down to what
            // actually changed, with secrets redacted.
            $table->json('changes')->nullable();

            $table->string('ip_address', 45)->nullable();

            $table->timestamp('created_at')->useCurrent();

            // The three questions the screen asks: what happened to this
            // record, what did this person do, and what happened recently.
            $table->index(['entity_type', 'entity_id'], 'audit_logs_entity_index');
            $table->index(['user_id', 'created_at'], 'audit_logs_user_index');
            $table->index('created_at', 'audit_logs_created_at_index');
            $table->index('action', 'audit_logs_action_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
