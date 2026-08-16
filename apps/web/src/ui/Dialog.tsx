import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { cn } from "./cn";

export function ModalShell(props: {
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-20 bg-black/55" />
        <Dialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-20 max-h-[min(86vh,900px)] w-[min(480px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[20px] border border-line bg-card p-5 shadow-modal outline-none",
            props.wide &&
              "flex w-[min(860px,calc(100%-48px))] flex-col overflow-hidden p-0",
            props.className,
          )}
        >
          {props.children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
