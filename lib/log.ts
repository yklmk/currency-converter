import chalk from "chalk"

export function createLogger(scope: string) {
  const prefix = chalk.dim(`[${scope}]`)

  return {
    success: (message: string) =>
      console.info(` ${chalk.green("✓")} ${prefix} ${message}`),
    warn: (message: string) =>
      console.warn(` ${chalk.yellow("⚠")} ${prefix} ${chalk.yellow(message)}`),
    error: (message: string) =>
      console.error(` ${chalk.red("⨯")} ${prefix} ${chalk.red(message)}`),
  }
}

export const highlight = (value: string | number) => chalk.bold(String(value))
