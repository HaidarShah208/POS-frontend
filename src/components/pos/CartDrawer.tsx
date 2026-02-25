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

export function CartDrawer() {
  const totalQty = useAppSelector(selectCartTotalQuantity);
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="accent" size="lg" className="relative">
          Cart
          {totalQty > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 min-w-5 px-1" variant="secondary">
              {totalQty}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent side="right" className="max-w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Cart</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          <CartPanel />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
