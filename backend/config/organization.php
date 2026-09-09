<?php

return [
    /*
    | Identity printed on every generated report. It was previously repeated as
    | a string literal across a dozen frontend components; reports read it from
    | here so a rename is one edit.
    */
    'name' => env('ORG_NAME', 'جمعية أماسو الخيرية'),

    // PNG so a transparent version drops straight in.
    'logo_path' => resource_path('images/amaso-logo.png'),
];
