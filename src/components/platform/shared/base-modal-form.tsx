"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FormProgress } from "./form-utils";
import { cn } from "@/lib/utils";

// ============================================================================
// Base Modal Form Component
// ============================================================================

interface BaseModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function BaseModalForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  currentStep,
  totalSteps,
  className,
  size = "lg"
}: BaseModalFormProps) {
  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          "max-h-[90vh] overflow-hidden flex flex-col",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
          {currentStep && totalSteps && (
            <FormProgress
              currentStep={currentStep}
              totalSteps={totalSteps}
              className="mt-4"
            />
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Form Modal Trigger Button
// ============================================================================

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

interface ModalTriggerButtonProps {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  onClick?: () => void;
}

export function ModalTriggerButton({
  label,
  icon = <Plus className="h-4 w-4" />,
  variant = "outline",
  size = "sm",
  className,
  onClick
}: ModalTriggerButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("", className)}
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </Button>
  );
}

// ============================================================================
// Form Modal Wrapper (combines trigger and modal)
// ============================================================================

interface FormModalWrapperProps {
  triggerLabel: string;
  triggerIcon?: React.ReactNode;
  modalTitle: string;
  modalDescription?: string;
  children: (props: { open: boolean; onOpenChange: (open: boolean) => void }) => React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function FormModalWrapper({
  triggerLabel,
  triggerIcon,
  modalTitle,
  modalDescription,
  children,
  size = "lg"
}: FormModalWrapperProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ModalTriggerButton
        label={triggerLabel}
        icon={triggerIcon}
        onClick={() => setOpen(true)}
      />
      {children({ open, onOpenChange: setOpen })}
    </>
  );
}