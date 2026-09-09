<?php

return [
    /*
    | Identity printed on every generated report. It was previously repeated as
    | a string literal across a dozen frontend components; reports read it from
    | here so a rename is one edit.
    |
    | These are defaults only: an admin can override each of them from the
    | settings screen, and App\Support\OrganizationSettings prefers whatever is
    | stored there.
    */
    'name' => env('ORG_NAME', 'جمعية المنصور لكفالة اليتيم'),
    'address' => env('ORG_ADDRESS'),
    'phone' => env('ORG_PHONE'),
    'email' => env('ORG_EMAIL'),

    // PNG so a transparent version drops straight in.
    'logo_path' => resource_path('images/amaso-logo.png'),
];
