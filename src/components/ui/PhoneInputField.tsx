// src/components/ui/PhoneInputField.tsx
import { Control, Controller, FieldValues, FieldPath } from "react-hook-form";
import { PhoneInput } from "react-international-phone";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, Phone } from "lucide-react";
import "react-international-phone/style.css";

interface PhoneInputFieldProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PhoneInputField<T extends FieldValues>({
  control,
  name,
  label = "Teléfono",
  placeholder = "Ingresa tu número",
  required = false,
  disabled = false,
}: PhoneInputFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-[#686363] font-medium text-sm sm:text-base">
            <Phone className="h-4 w-4 text-[#63bae9]" />
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <PhoneInput
              defaultCountry="ar"
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              className="h-12"
              inputClassName="h-full rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 text-[#686363] placeholder-[#969696] bg-slate-50/50"
              countrySelectorStyleProps={{
                buttonClassName: "rounded-l-xl border-r-0",
              }}
              dialCodePreviewStyleProps={{
                className: "text-[#686363]",
              }}
            />
          </FormControl>
          {error && (
            <FormMessage className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error.message}
            </FormMessage>
          )}
        </FormItem>
      )}
    />
  );
}