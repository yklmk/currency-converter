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
  currencies: Currency[]
  setCurrency: (currency: Currency) => void
}

const TITLE = "Select currency"
const DESCRIPTION = "Choose the currency you want to use"

export default function CurrencySelectModal({
  isOpen,
  onOpenChange,
  currencies,
  setCurrency,
}: CurrencySelectModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const closeModal = () => onOpenChange(false)

  const sortedCurrencies = currencies.sort((a, b) => {
    if (a.currencyName < b.currencyName) {
      return -1
    }
    if (a.currencyName > b.currencyName) {
      return 1
    }
    return 0
  })

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent onEscapeKeyDown={closeModal} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{TITLE}</DialogTitle>
            <DialogDescription>{DESCRIPTION}</DialogDescription>
          </DialogHeader>

          <CurrenciesList
            className="max-h-[280px]"
            currencies={sortedCurrencies}
            onSelectCurrency={setCurrency}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button aria-label="Cancel" variant="outline">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{TITLE}</DrawerTitle>
          <DrawerDescription>{DESCRIPTION}</DrawerDescription>
        </DrawerHeader>

        <CurrenciesList
          className="mx-4 max-h-[70dvh]"
          currencies={sortedCurrencies}
          onSelectCurrency={setCurrency}
        />

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button aria-label="Cancel" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
