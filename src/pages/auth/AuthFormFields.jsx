import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { cn } from "@/lib/utils";

export function LabelInput({
  label,
  id,
  hint = "",
  required = false,
  wrapperClassName = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={cn("flex flex-col gap-2", wrapperClassName)}>
      <Label htmlFor={id} className="text-sm font-medium text-black/68">
        {label}
        {required ? <span className="ml-0.5 text-black/36">*</span> : null}
      </Label>
      <Input
        id={id}
        required={required}
        className={cn(
          "h-12 rounded-2xl border-black/10 bg-white px-4 text-sm text-black",
          "placeholder:text-black/36",
          "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
          "focus-visible:ring-black/18 focus-visible:border-black/18",
          inputClassName,
        )}
        {...props}
      />
      {hint ? <p className="text-xs leading-5 text-black/44">{hint}</p> : null}
    </div>
  );
}

export function SubmitButton({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full",
        "bg-black text-sm font-medium text-white",
        "shadow-[0_16px_40px_rgba(15,23,42,0.18)]",
        "transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
    </button>
  );
}
