"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
};

export function FormDrawer(p: FormDrawerProps) {
  return (
    <Drawer open={p.open} onOpenChange={p.onOpenChange}>
      <DrawerContent side={p.side ?? "right"} className={cn("max-w-md", p.className)}>
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>{p.title}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">×</Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">{p.children}</div>
      </DrawerContent>
    </Drawer>
  );
}
