<!DOCTYPE html>
{{-- Plain table-and-inline-styles HTML, because mail clients are not
     browsers: no external stylesheet, no flexbox, nothing that needs a
     network fetch to render. --}}
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>رمز الدخول</title>
</head>
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e4e6eb;">
        <tr>
            <td style="padding:24px 24px 8px;text-align:center;">
                <div style="font-size:18px;font-weight:bold;color:#111827;">{{ $association }}</div>
            </td>
        </tr>
        <tr>
            <td style="padding:8px 24px;text-align:right;color:#374151;font-size:15px;line-height:1.7;">
                مرحباً {{ $name }}،<br>
                هذا رمز الدخول إلى نظام الجمعية:
            </td>
        </tr>
        <tr>
            <td style="padding:16px 24px;text-align:center;">
                {{-- ltr on the digits: an RTL container reorders a run of
                     numbers, and a code read backwards is a code refused. --}}
                <div dir="ltr" style="display:inline-block;padding:14px 28px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:10px;font-size:32px;letter-spacing:10px;font-weight:bold;color:#111827;">{{ $code }}</div>
            </td>
        </tr>
        <tr>
            <td style="padding:8px 24px 20px;text-align:right;color:#6b7280;font-size:13px;line-height:1.7;">
                الرمز صالح لمدة {{ $minutes }} دقائق، ولمرة واحدة فقط.<br>
                إذا لم تطلب هذا الرمز، فلا داعي لأي إجراء — لن يدخل أحد إلى الحساب بدونه، لكن
                يُستحسن تغيير كلمة المرور وإخبار مدير النظام.
            </td>
        </tr>
        <tr>
            <td style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e4e6eb;border-radius:0 0 12px 12px;text-align:center;color:#9ca3af;font-size:12px;">
                رسالة آلية من نظام {{ $association }} — لا تردّ عليها.
            </td>
        </tr>
    </table>
</body>
</html>
