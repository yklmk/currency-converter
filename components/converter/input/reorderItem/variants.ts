import { Variants } from "motion/react"

const itemVariants: Variants = {
  initial: {
    height: 0,
    opacity: 0,
    marginBottom: 0,
  },
  visible: {
    height: "auto",
    opacity: 1,
    marginBottom: "0.5rem",
    transition: {
      type: "tween",
      duration: 0.25,
      ease: [0.25, 1, 0.5, 1],
      opacity: { duration: 0.15 },
    },
  },
  hidden: {
    height: 0,
    opacity: 0,
    marginBottom: 0,
    transition: {
      type: "tween",
      duration: 0.22,
      ease: [0.25, 1, 0.5, 1],
      opacity: { duration: 0.15 },
    },
  },
}

const reducedItemVariants: Variants = {
  initial: itemVariants.initial,
  visible: {
    height: "auto",
    opacity: 1,
    marginBottom: "0.5rem",
    transition: { duration: 0, opacity: { duration: 0.15 } },
  },
  hidden: {
    height: 0,
    opacity: 0,
    marginBottom: 0,
    transition: { duration: 0, opacity: { duration: 0.15 } },
  },
}

const buttonVariants: Variants = {
  initial: {
    x: -20,
  },
  visible: {
    x: 0,
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.5,
    },
  },
  hidden: {
    x: -20,
  },
}

export { itemVariants, reducedItemVariants, buttonVariants }
