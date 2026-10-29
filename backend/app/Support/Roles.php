<?php

namespace App\Support;

use App\Models\User;

/**
 * Who may change what.
 *
 * The role middleware takes a comma-separated list, so a route could spell
 * its own out. Sixty routes spelling their own out is how a permission
 * model drifts: one endpoint gets added without the list, nobody notices,
 * and the role means nothing. The groups below are the model, written once
 * and read by every route that enforces it.
 *
 * Two rules hold the whole thing together:
 *
 *  - Reading is open to anyone with an account. An accountant has to be
 *    able to open a family to understand an expense charged to her, and a
 *    social worker has to see the budget an aid payment came out of.
 *    Blinding people to the records they work beside does not make the
 *    association safer, it makes them ask someone else to look.
 *  - Writing is held to the people whose job it is. That is the whole of
 *    the model: every gate below is on a write.
 *
 * ADMIN and SUPERUSER appear in every group deliberately. An association
 * this size has evenings where one person is the only one in the office,
 * and a permission model that stops the director fixing a typo at 9pm is a
 * model that gets switched off.
 */
final class Roles
{
    /** Handing out access, and the record of what everyone did. */
    public const SUPERUSER = 'role:' . User::ROLE_SUPERUSER;

    /** The association's own identity and settings. */
    public const ADMIN = 'role:' . User::ROLE_ADMIN . ',' . User::ROLE_SUPERUSER;

    /**
     * The books: income, expenses, transfers, the accounts money sits in,
     * the fiscal year, and the categories any of it is filed under.
     */
    public const FINANCE = 'role:' . User::ROLE_ADMIN . ',' . User::ROLE_SUPERUSER
        . ',' . User::ROLE_ACCOUNTANT;

    /**
     * The families and the children in them, and the reference lists the
     * social file is built from.
     */
    public const FAMILIES = 'role:' . User::ROLE_ADMIN . ',' . User::ROLE_SUPERUSER
        . ',' . User::ROLE_SOCIAL_WORKER;

    /**
     * Enrollments, marks, schools, academic years, and the transport that
     * gets the children to them.
     *
     * The social worker is in this group on purpose: before there was an
     * education officer, registrations were theirs, and taking that away
     * from an association that may not have filled the new post yet would
     * break a job somebody is doing today.
     */
    public const EDUCATION = 'role:' . User::ROLE_ADMIN . ',' . User::ROLE_SUPERUSER
        . ',' . User::ROLE_EDUCATION_OFFICER . ',' . User::ROLE_SOCIAL_WORKER;

    /**
     * Closing a transport month, which freezes the split and links the
     * expense that pays for it.
     *
     * Wider than EDUCATION by the accountant, because the expense side is
     * theirs, and narrower than "anyone in education" is not the point:
     * closing does not approve the money. The expense it links still has to
     * be approved by FINANCE like any other, so the person who runs the
     * month cannot also decide the association has paid for it.
     */
    public const TRANSPORT_SETTLEMENT = 'role:' . User::ROLE_ADMIN . ',' . User::ROLE_SUPERUSER
        . ',' . User::ROLE_ACCOUNTANT . ',' . User::ROLE_EDUCATION_OFFICER;

    /**
     * Recording what was spent on a family, before anybody approves it.
     *
     * A social worker hands out the aid, so a social worker writes down
     * that it went out. Turning that record into money the books count is
     * FINANCE's, and that gate is on the approve route, not here.
     */
    public const EXPENSE_ENTRY = 'role:' . User::ROLE_ADMIN . ',' . User::ROLE_SUPERUSER
        . ',' . User::ROLE_ACCOUNTANT . ',' . User::ROLE_SOCIAL_WORKER;
}
