"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type ClearCartModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ClearCartModal(props: ClearCartModalProps) {
  const { open, onOpenChange, onConfirm } = props;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Clear cart?</ModalTitle>
        </ModalHeader>
        <p className="text-sm text-[var(--muted-foreground)]">
          All items will be removed. This cannot be undone.
        </p>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Cancel</Button>
          </ModalClose>
          <Button variant="destructive" onClick={handleConfirm}>
            Clear cart
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
