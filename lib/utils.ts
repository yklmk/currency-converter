import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // The plugin mistakes the `inputs` variable for a class name.
  // eslint-disable-next-line tailwindcss/no-custom-classname
  return twMerge(clsx(inputs))
}
