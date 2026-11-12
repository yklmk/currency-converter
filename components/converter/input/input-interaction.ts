export function isNativeInputInteraction(
  target: EventTarget | null,
  pointerType: string
): boolean {
  // Mouse/pen edit directly; touch preserves selection in an already focused input.
  return (
    target instanceof HTMLInputElement &&
    (pointerType !== "touch" || target === target.ownerDocument.activeElement)
  )
}
