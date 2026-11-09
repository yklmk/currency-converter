import { useMediaQuery } from "usehooks-ts"

import { Currency } from "@/types/currency"
import { Button } from "@/components/ui/button"
import CurrenciesList from "@/components/ui/currencies-list"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

interface CurrencySelectModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  currencies: Currency[]
  setCurrency: (currency: Currency) => void
}

const TITLE = "Select Currency"
const DESCRIPTION = "Choose the currency you want to use"

export default function CurrencySelectModal({
  isOpen,
  onOpenChange,
  onClose,
  currencies,
  setCurrency,
}: CurrencySelectModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const sortedCurrencies = [...currencies].sort((a, b) => {
    if (a.currencyName < b.currencyName) {
      return -1
    }
    if (a.currencyName > b.currencyName) {
      return 1
    }
    return 0
  })

  const handleCloseAutoFocus = (event: Event) => {
    event.preventDefault()
    onClose()
  }

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <DialogHeader>
            <DialogTitle>{TITLE}</DialogTitle>
            <DialogDescription>{DESCRIPTION}</DialogDescription>
          </DialogHeader>

          <CurrenciesList
            className="max-h-70"
            currencies={sortedCurrencies}
            onSelectCurrency={setCurrency}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground>
      <DrawerContent onCloseAutoFocus={handleCloseAutoFocus}>
        <DrawerHeader>
          <DrawerTitle>{TITLE}</DrawerTitle>
          <DrawerDescription>{DESCRIPTION}</DrawerDescription>
        </DrawerHeader>

        <CurrenciesList
          className="mx-4 max-h-[70dvh] pb-2"
          currencies={sortedCurrencies}
          onSelectCurrency={setCurrency}
        />

        <DrawerFooter className="pb-[max(--spacing(10),env(safe-area-inset-bottom))]">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
