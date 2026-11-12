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
     * Everyone who runs the month sheet (EDUCATION), plus the accountant,
     * whose expense it is. Closing does not approve the money: the expense
     * it links still has to be approved by FINANCE like any other, so the
     * person who runs the month cannot also decide the association has paid.
     *
     * Settling a month is two calls - write the expense, then close the
     * month on it - so this group and EXPENSE_ENTRY have to overlap on
     * everyone who settles. They once did not: the education officer could
     * close a month but not write its expense, and a social worker could
     * write the expense and then be refused the close, leaving an expense
     * with no month. Keep the two in step.
     */
    public const TRANSPORT_SETTLEMENT = 'role:' . User::ROLE_ADMIN . ',' . User::ROLE_SUPERUSER
        . ',' . User::ROLE_ACCOUNTANT . ',' . User::ROLE_EDUCATION_OFFICER . ',' . User::ROLE_SOCIAL_WORKER;

    /**
     * Writing down what was spent, before anybody approves it.
     *
     * Whoever hands money out writes down that it went: the social worker
     * for a family's aid, the education officer for a month's transport.
     * Turning that record into money the books count is FINANCE's, and that
     * gate is on the approve route, not here - a draft moves no balance and
     * appears in no report.
     */
    public const EXPENSE_ENTRY = 'role:' . User::ROLE_ADMIN . ',' . User::ROLE_SUPERUSER
        . ',' . User::ROLE_ACCOUNTANT . ',' . User::ROLE_SOCIAL_WORKER . ',' . User::ROLE_EDUCATION_OFFICER;
}
