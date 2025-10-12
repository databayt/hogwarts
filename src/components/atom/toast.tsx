'use client';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const SuccessToast = (message: string) => {
    toast.success(message, {
        icon: <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth={3}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>,
        duration: 1500,
        position: "bottom-right",
        style: {
            border: 'none',
            padding: '0px',
            background: 'transparent',
            boxShadow: 'none',
            minWidth: 'auto',
            minHeight: 'auto'
        }
    });
};

export const ErrorToast = (message: string) => {
    toast.error(message, {
        style: {
            background: 'rgb(239 68 68)',
            color: 'white',
            border: 'none',
            width: '220px',
            maxWidth: '220px'
        }
    });
};

export const InfoToast = (message: string) => {
    toast.info(message, {
        style: {
            background: 'rgb(59 130 246)',
            color: 'white',
            border: 'none',
            width: '220px',
            maxWidth: '220px'
        }
    });
};

export const DeleteToast = (message: string = "Deleted") => {
    toast(message, {
        style: {
            background: 'rgb(239 68 68)',
            color: 'white',
            border: 'none',
            width: '220px',
            maxWidth: '220px',
            textAlign: 'right'
        },
        duration: 2000,
        position: 'bottom-right'
    });
};

// Imperative confirm dialog powered by shadcn/ui Dialog
type ConfirmOptions = { title?: string; description?: string; confirmText?: string; cancelText?: string };
type InternalConfirmState = ConfirmOptions & { open: boolean; resolve?: (v: boolean) => void };

let confirmController: { open: (opts: ConfirmOptions & { resolve: (v: boolean) => void }) => void } | null = null;

function ConfirmDialogRenderer() {
    const [state, setState] = useState<InternalConfirmState>({ open: false, title: undefined, description: undefined, confirmText: undefined, cancelText: undefined, resolve: undefined });

    useEffect(() => {
        confirmController = {
            open: (opts) => {
                setState({ open: true, ...opts });
            },
        };
        return () => {
            confirmController = null;
        };
    }, []);

    const onClose = () => {
        setState((s) => ({ ...s, open: false }));
    };

    const onCancel = () => {
        state.resolve?.(false);
        onClose();
    };

    const onConfirm = () => {
        state.resolve?.(true);
        onClose();
    };

    return (
        <Dialog open={state.open} onOpenChange={(o) => { if (!o) onCancel(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{state.title ?? 'Are you sure?'}</DialogTitle>
                    {state.description ? (
                        <DialogDescription>{state.description}</DialogDescription>
                    ) : null}
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>{state.cancelText ?? 'Cancel'}</Button>
                    <Button variant="destructive" onClick={onConfirm}>{state.confirmText ?? 'Delete'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Ensure a single portal root is mounted on the client
if (typeof window !== 'undefined') {
    const id = '__confirm_dialog_root__';
    let container = document.getElementById(id);
    if (!container) {
        container = document.createElement('div');
        container.id = id;
        document.body.appendChild(container);
        ReactDOM.createRoot(container).render(<ConfirmDialogRenderer />);
    }
}

export function confirmDeleteDialog(message?: string): Promise<boolean> {
    return new Promise((resolve) => {
        const title = 'Delete item';
        const description = message ?? 'This action cannot be undone.';
        if (!confirmController) return resolve(false);
        confirmController.open({ title, description, confirmText: 'Delete', cancelText: 'Cancel', resolve });
    });
}