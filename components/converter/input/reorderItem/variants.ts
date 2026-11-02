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
    marginBottom: "0.75rem",
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.6,
      opacity: { delay: 0.1 },
    },
  },
  hidden: {
    height: 0,
    opacity: 0,
    scale: 0.8,
    marginBottom: 0,
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.6,
      opacity: { duration: 0.15 },
      scale: { duration: 0.2 },
    },
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

export { itemVariants, buttonVariants }
