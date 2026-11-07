import { Laptop, Moon, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { useLocalStorage, useMediaQuery } from "usehooks-ts"

import { Settings } from "@/types/settings"
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
import { Flag, flagSets, FlagSetsType } from "@/components/ui/flag"
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

interface FlagSetSelectProps {
  flagSet: FlagSetsType
  setFlagSet: (flagSet: FlagSetsType) => void
}

function FlagSetSelect({ flagSet, setFlagSet }: FlagSetSelectProps) {
  return (
    <Select defaultValue={flagSet} onValueChange={setFlagSet}>
      <SelectTrigger aria-label="Toggle theme" className="w-3/5">
        <SelectValue>
          <div className="flex items-center">
            <div className="mr-1 flex">
              <Flag
                flagSet={flagSet as FlagSetsType}
                countryCode="gb"
                flagClassName="border-none"
              />
              <Flag
                flagSet={flagSet as FlagSetsType}
                countryCode="us"
                flagClassName="ring-background ring-2 -translate-x-2 border-none group-focus:ring-accent"
              />
            </div>

            <span className="capitalize">{flagSet}</span>
          </div>
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {Object.keys(flagSets).map((flagSet) => (
          <SelectItem key={flagSet} value={flagSet} className="group">
            <div className="flex items-center">
              <div className="mr-1 flex">
                <Flag
                  flagSet={flagSet as FlagSetsType}
                  countryCode="gb"
                  flagClassName="border-none"
                />
                <Flag
                  flagSet={flagSet as FlagSetsType}
                  countryCode="us"
                  flagClassName="ring-background ring-2 -translate-x-2 border-none group-focus:ring-accent"
                />
              </div>

              <span className="capitalize">{flagSet}</span>
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
  const [settings, setSettings] = useLocalStorage<Settings>("settings", {
    flagSet: "colorful",
  })
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const onFlagSetChange = (flagSet: FlagSetsType) => {
    setSettings({ ...settings, flagSet })
  }

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

          <Label className="flex items-center justify-between">
            Flag set
            <FlagSetSelect
              flagSet={settings.flagSet}
              setFlagSet={onFlagSetChange}
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

        <div className="px-4 pb-4">
          <Label className="flex items-center justify-between">
            Flag set
            <FlagSetSelect
              flagSet={settings.flagSet}
              setFlagSet={onFlagSetChange}
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
