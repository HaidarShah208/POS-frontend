"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { CartPanel } from "./CartPanel";
import { useAppSelector } from "@/hooks/redux";
import { selectCartTotalQuantity } from "@/redux/selectors";
import { Badge } from "@/components/ui/badge";

type CartDrawerProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCheckoutClick?: () => void;
};

export function CartDrawer({ open, onOpenChange, onCheckoutClick }: CartDrawerProps) {
  const totalQty = useAppSelector(selectCartTotalQuantity);
  const controlled = open !== undefined && onOpenChange !== undefined;

  const trigger = (
    <Button
      variant="accent"
      size="lg"
      className="relative pos-touch min-h-[44px]"
      onClick={controlled ? () => onOpenChange(true) : undefined}
    >
      Cart
      {totalQty > 0 && (
        <Badge className="absolute -right-2 -top-2 h-5 min-w-5 px-1" variant="secondary">
          {totalQty}
        </Badge>
      )}
    </Button>
  );

  return (
    <Drawer open={controlled ? open : undefined} onOpenChange={controlled ? onOpenChange : undefined}>
      {controlled ? trigger : <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent side="right" className="max-w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Cart</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          <CartPanel
            onCheckoutClick={
              onCheckoutClick ?? (controlled ? () => onOpenChange?.(false) : undefined)
            }
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
