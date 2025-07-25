"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { OTPInput, SlotProps } from "input-otp";
import { Minus } from "lucide-react";
import { useId } from "react";

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
}

function Component({ value, onChange }: OTPInputProps) {
  const id = useId();
  return (
    <div className="space-y-4 min-w-[300px] bg-white text-gray-900">
      <Label htmlFor={id} className="text-lg font-semibold text-gray-800">Enter verification code</Label>
      <OTPInput
        id={id}
        value={value}
        onChange={onChange}
        containerClassName="flex items-center gap-4 has-[:disabled]:opacity-50"
        maxLength={6}
        render={({ slots }) => (
          <>
            <div className="flex gap-2">
              {slots.slice(0, 3).map((slot, idx) => (
                <Slot key={idx} {...slot} />
              ))}
            </div>

            <div className="text-emerald-400">
              <Minus size={20} strokeWidth={3} aria-hidden="true" />
            </div>

            <div className="flex gap-2">
              {slots.slice(3).map((slot, idx) => (
                <Slot key={idx} {...slot} />
              ))}
            </div>
          </>
        )}
      />
      <p className="text-sm text-gray-500 text-center">
        Please enter the 6-digit code sent to your email
      </p>
    </div>
  );
}

function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        "relative flex size-12 items-center justify-center border-2 border-gray-200 bg-gray-50 font-bold text-xl text-gray-800 shadow-sm transition-all duration-300 rounded-xl hover:border-emerald-300 hover:bg-emerald-50",
        props.isActive && "border-emerald-500 bg-white ring-4 ring-emerald-100 scale-105"
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  );
}

export { Component }; 