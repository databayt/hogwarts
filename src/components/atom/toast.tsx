'use client';
import { toast } from 'sonner';

export const SuccessToast = () => {
    toast.success('', {
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

export const DeleteToast = (message: string = "Deleted successfully") => {
    toast.success(message, {
        style: {
            background: 'rgb(34 197 94)',
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