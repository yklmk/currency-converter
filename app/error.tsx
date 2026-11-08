"use client"

import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-6 pb-8 md:py-12">
      <h1 className="text-2xl font-extrabold">Oops!</h1>
      <p className="pb-8 text-2xl font-extrabold">Something went wrong!</p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  )
}
