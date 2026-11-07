import { Laptop, Moon, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { useMediaQuery } from "usehooks-ts"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SettingsModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const TITLE = "Settings"

const options = {
  light: {
    icon: <SunMedium className="mr-2 size-4" />,
    label: "Light",
  },
  dark: {
    icon: <Moon className="mr-2 size-4" />,
    label: "Dark",
  },
  system: {
    icon: <Laptop className="mr-2 size-4" />,
    label: "System",
  },
}

interface ThemeSelectProps {
  resolvedTheme: string
  setTheme: (theme: string) => void
}

function ThemeSelect({ resolvedTheme, setTheme }: ThemeSelectProps) {
  return (
    <Select defaultValue={resolvedTheme} onValueChange={setTheme}>
      <SelectTrigger aria-label="Toggle theme" className="w-3/5">
        <SelectValue>
          <div className="flex items-center">
            {options[resolvedTheme as keyof typeof options].icon}
            {options[resolvedTheme as keyof typeof options].label}
          </div>
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {Object.entries(options).map(([key, { icon, label }]) => (
          <SelectItem key={key} value={key}>
            <div className="flex items-center">
              {icon}
              {label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default function SettingsModal({
  isOpen,
  onOpenChange,
}: SettingsModalProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{TITLE}</DialogTitle>
          </DialogHeader>

          <Label className="flex items-center justify-between">
            Theme
            <ThemeSelect
              resolvedTheme={resolvedTheme || "light"}
              setTheme={setTheme}
            />
          </Label>

          <DialogFooter>
            <DialogClose asChild>
              <Button aria-label="Close">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{TITLE}</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 pb-3">
          <Label className="flex items-center justify-between">
            Theme
            <ThemeSelect
              resolvedTheme={resolvedTheme || "light"}
              setTheme={setTheme}
            />
          </Label>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button aria-label="Close">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
