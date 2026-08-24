import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: ['rounded-card', 'rounded-inner', 'rounded-control', 'rounded-badge'],
    },
  },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
