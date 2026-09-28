"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * A password box you can look inside.
 *
 * Every one of these is typed blind, and the ones that matter most are typed
 * twice: setting a new password, confirming it, resetting somebody else's.
 * Without a way to check, a mistyped character means an account whose
 * password nobody knows - and on the creation form, the person typing is
 * inventing the password rather than recalling it, so there is nothing to
 * check it against afterwards.
 *
 * The login page had grown its own copy of this. It uses this one now, so
 * the eye sits in the same place and means the same thing everywhere.
 */
export interface PasswordInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, "type"> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          // Passwords are typed in Latin characters even here, and left to
          // right - the same reason the login box sets this.
          dir="ltr"
          className={cn("pl-10 text-left", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          onClick={() => setVisible((shown) => !shown)}
          disabled={props.disabled}
          className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = "PasswordInput"
