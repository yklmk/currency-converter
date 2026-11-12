import { Variants } from "motion/react"

// Motion can't read CSS variables: this is `ease` with the enter and exit
// durations from globals.css.
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

// Keep the card full-sized; the list wrapper owns the height animation.
// A new row waits 50ms so the growing card has room for it before it shows.
const itemVariants: Variants = {
  initial: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: EASE, delay: 0.05 },
  },
  hidden: { opacity: 0, transition: { duration: 0.12, ease: EASE } },
}

export { itemVariants }
