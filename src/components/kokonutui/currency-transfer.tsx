"use client";

/**
 * @author: @dorian_baffier
 * @description: Currency Transfer
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import {
    ArrowUpIcon,
    ArrowDownIcon,
    InfoIcon,
    ArrowUpDown,
    Check,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CheckmarkProps {
    size?: number;
    strokeWidth?: number;
    color?: string;
    className?: string;
}

const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: {
                delay: i * 0.2,
                type: "spring",
                duration: 1.5,
                bounce: 0.2,
                ease: [0.22, 1, 0.36, 1],
            },
            opacity: { delay: i * 0.2, duration: 0.3 },
        },
    }),
};

export function Checkmark({
    size = 100,
    strokeWidth = 2,
    color = "currentColor",
    className = "",
}: CheckmarkProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial="hidden"
            animate="visible"
            className={className}
        >
            <title>Animated Checkmark</title>
            <motion.circle
                cx="50"
                cy="50"
                r="42"
                stroke={color}
                variants={draw as any}
                custom={0}
                style={{
                    strokeWidth,
                    strokeLinecap: "round",
                    fill: "transparent",
                    filter: "drop-shadow(0 0 2px rgba(16, 185, 129, 0.2))",
                }}
            />
            <motion.path
                d="M32 50L45 63L68 35"
                stroke={color}
                variants={draw as any}
                custom={1}
                style={{
                    strokeWidth: strokeWidth + 0.5,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    fill: "transparent",
                    filter: "drop-shadow(0 0 1px rgba(16, 185, 129, 0.3))",
                }}
            />
        </motion.svg>
    );
}

export default function CurrencyTransfer() {
    const [isCompleted, setIsCompleted] = useState(false);
    const transactionId = "TXN-DAB3UL494";

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsCompleted(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <TooltipProvider>
            <Card className="w-full max-w-sm mx-auto p-6 h-[420px] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 backdrop-blur-sm shadow-[0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:border-emerald-500/20 dark:hover:border-emerald-500/20 transition-all duration-500">
                <CardContent className="flex-1 flex flex-col justify-center space-y-4">
                    <div className="h-[80px] flex items-center justify-center">
                        <motion.div
                            className="flex justify-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <div className="relative w-[100px] h-[100px] flex items-center justify-center">
                                <motion.div
                                    className="absolute inset-0 blur-2xl bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full"
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0.8],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        times: [0, 0.5, 1],
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                />
                                <AnimatePresence mode="wait">
                                    {!isCompleted ? (
                                        <motion.div
                                            key="progress"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{
                                                opacity: 0,
                                                rotate: 360,
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                ease: "easeInOut",
                                            }}
                                            className="w-[100px] h-[100px] flex items-center justify-center"
                                        >
                                            <div className="relative z-10">
                                                <motion.div
                                                    className="absolute inset-0 rounded-full border-2 border-transparent"
                                                    style={{
                                                        borderLeftColor:
                                                            "rgb(16 185 129)",
                                                        borderTopColor:
                                                            "rgb(16 185 129 / 0.2)",
                                                        filter: "blur(0.5px)",
                                                    }}
                                                    animate={{
                                                        rotate: 360,
                                                        scale: [1, 1.02, 1],
                                                    }}
                                                    transition={{
                                                        rotate: {
                                                            duration: 3,
                                                            repeat: Infinity,
                                                            ease: "linear",
                                                        },
                                                        scale: {
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                        },
                                                    }}
                                                />
                                                <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-full p-5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                    <ArrowUpDown className="h-10 w-10 text-emerald-500" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="completed"
                                            initial={{
                                                opacity: 0,
                                                rotate: -180,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                rotate: 0,
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                ease: "easeInOut",
                                            }}
                                            className="w-[100px] h-[100px] flex items-center justify-center"
                                        >
                                            <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-full p-5 border border-emerald-500">
                                                <Check
                                                    className="h-10 w-10 text-emerald-500"
                                                    strokeWidth={3.5}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                    <div className="h-[280px] flex flex-col">
                        <motion.div
                            className="space-y-2 text-center w-full mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.3,
                                duration: 0.8,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {isCompleted ? (
                                    <motion.h2
                                        key="completed-title"
                                        className="text-lg text-zinc-900 dark:text-zinc-100 tracking-tighter font-semibold uppercase"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{
                                            duration: 0.5,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    >
                                        Transfer Completed
                                    </motion.h2>
                                ) : (
                                    <motion.h2
                                        key="progress-title"
                                        className="text-lg text-zinc-900 dark:text-zinc-100 tracking-tighter font-semibold uppercase"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{
                                            duration: 0.5,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    >
                                        Transfer in Progress
                                    </motion.h2>
                                )}
                            </AnimatePresence>
                            <AnimatePresence mode="wait">
                                {isCompleted ? (
                                    <motion.div
                                        key="completed-id"
                                        className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{
                                            duration: 0.4,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    >
                                        Transaction ID: {transactionId}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="progress-status"
                                        className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{
                                            duration: 0.4,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    >
                                        Processing Transaction...
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="flex items-center gap-4 mt-4">
                                <motion.div
                                    className="flex-1 relative"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: 0.3,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    <motion.div
                                        className="flex flex-col items-start relative"
                                        initial={{ gap: "12px" }}
                                        animate={{
                                            gap: isCompleted ? "0px" : "12px",
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            ease: [0.32, 0.72, 0, 1],
                                        }}
                                    >
                                        <motion.div
                                            className={cn(
                                                "w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5 border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-md transition-all duration-300",
                                                isCompleted
                                                    ? "rounded-b-none border-b-0"
                                                    : "hover:border-emerald-500/30"
                                            )}
                                            animate={{
                                                y: 0,
                                                scale: 1,
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                ease: [0.32, 0.72, 0, 1],
                                            }}
                                        >
                                            <div className="space-y-1 w-full">
                                                <motion.span
                                                    className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"
                                                    initial={{ opacity: 1 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{
                                                        duration: 0.3,
                                                        ease: [
                                                            0.22, 1, 0.36, 1,
                                                        ],
                                                    }}
                                                >
                                                    <ArrowUpIcon className="w-3 h-3" />
                                                    From
                                                </motion.span>
                                                <div className="flex flex-col gap-1.5">
                                                    <motion.div
                                                        className="flex items-center gap-2.5 group"
                                                        initial={{ opacity: 1 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{
                                                            duration: 0.3,
                                                            ease: [
                                                                0.22, 1, 0.36,
                                                                1,
                                                            ],
                                                        }}
                                                    >
                                                        <motion.span
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-zinc-900 shadow-lg border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 transition-colors duration-300"
                                                            whileHover={{
                                                                scale: 1.05,
                                                            }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 400,
                                                                damping: 10,
                                                            }}
                                                        >
                                                            $
                                                        </motion.span>
                                                        <div className="flex flex-col items-start">
                                                            <AnimatePresence mode="wait">
                                                                <motion.span
                                                                    key={
                                                                        isCompleted
                                                                            ? "completed-amount"
                                                                            : "processing-amount"
                                                                    }
                                                                    className={cn(
                                                                        "font-medium text-zinc-900 dark:text-zinc-100 tracking-tight"
                                                                    )}
                                                                    initial={{
                                                                        opacity:
                                                                            isCompleted
                                                                                ? 1
                                                                                : 0.5,
                                                                    }}
                                                                    animate={{
                                                                        opacity:
                                                                            isCompleted
                                                                                ? 1
                                                                                : 0.5,
                                                                    }}
                                                                    exit={{
                                                                        opacity:
                                                                            isCompleted
                                                                                ? 1
                                                                                : 0.5,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.3,
                                                                        ease: [
                                                                            0.22,
                                                                            1,
                                                                            0.36,
                                                                            1,
                                                                        ],
                                                                    }}
                                                                >
                                                                    500.00 USD
                                                                </motion.span>
                                                            </AnimatePresence>
                                                            <motion.span
                                                                className="text-xs text-zinc-500 dark:text-zinc-400"
                                                                initial={{
                                                                    opacity: 1,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                }}
                                                                transition={{
                                                                    duration: 0.3,
                                                                    ease: [
                                                                        0.22, 1,
                                                                        0.36, 1,
                                                                    ],
                                                                }}
                                                            >
                                                                Chase Bank
                                                                ••••4589
                                                            </motion.span>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className={cn(
                                                "w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5 border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-md transition-all duration-300",
                                                isCompleted
                                                    ? "rounded-t-none border-t-0"
                                                    : "hover:border-emerald-500/30"
                                            )}
                                            animate={{
                                                y: 0,
                                                scale: 1,
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                ease: [0.32, 0.72, 0, 1],
                                            }}
                                        >
                                            <div className="space-y-1 w-full">
                                                <motion.span
                                                    className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"
                                                    initial={{ opacity: 1 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{
                                                        duration: 0.3,
                                                        ease: [
                                                            0.22, 1, 0.36, 1,
                                                        ],
                                                    }}
                                                >
                                                    <ArrowDownIcon className="w-3 h-3" />
                                                    To
                                                </motion.span>
                                                <div className="flex flex-col gap-1.5">
                                                    <motion.div
                                                        className="flex items-center gap-2.5 group"
                                                        initial={{ opacity: 1 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{
                                                            duration: 0.3,
                                                            ease: [
                                                                0.22, 1, 0.36,
                                                                1,
                                                            ],
                                                        }}
                                                    >
                                                        <motion.span
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-zinc-900 shadow-lg border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 transition-colors duration-300"
                                                            whileHover={{
                                                                scale: 1.05,
                                                            }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 400,
                                                                damping: 10,
                                                            }}
                                                        >
                                                            €
                                                        </motion.span>
                                                        <div className="flex flex-col items-start">
                                                            <AnimatePresence mode="wait">
                                                                <motion.span
                                                                    key={
                                                                        isCompleted
                                                                            ? "completed-amount-eur"
                                                                            : "processing-amount-eur"
                                                                    }
                                                                    className={cn(
                                                                        "font-medium text-zinc-900 dark:text-zinc-100 tracking-tight"
                                                                    )}
                                                                    initial={{
                                                                        opacity:
                                                                            isCompleted
                                                                                ? 1
                                                                                : 0.5,
                                                                    }}
                                                                    animate={{
                                                                        opacity:
                                                                            isCompleted
                                                                                ? 1
                                                                                : 0.5,
                                                                    }}
                                                                    exit={{
                                                                        opacity:
                                                                            isCompleted
                                                                                ? 1
                                                                                : 0.5,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.3,
                                                                        ease: [
                                                                            0.22,
                                                                            1,
                                                                            0.36,
                                                                            1,
                                                                        ],
                                                                    }}
                                                                >
                                                                    460.00 EUR
                                                                </motion.span>
                                                            </AnimatePresence>
                                                            <motion.span
                                                                className="text-xs text-zinc-500 dark:text-zinc-400"
                                                                initial={{
                                                                    opacity: 1,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                }}
                                                                transition={{
                                                                    duration: 0.3,
                                                                    ease: [
                                                                        0.22, 1,
                                                                        0.36, 1,
                                                                    ],
                                                                }}
                                                            >
                                                                Deutsche Bank
                                                                ••••7823
                                                            </motion.span>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                </motion.div>
                            </div>
                            <motion.div
                                className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    delay: 0.5,
                                    duration: 0.6,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {isCompleted ? (
                                        <motion.span
                                            key="completed-rate"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{
                                                duration: 0.4,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                        >
                                            Exchange Rate: 1 USD = 0.92 EUR
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            key="calculating-rate"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{
                                                duration: 0.4,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                        >
                                            Calculating exchange rate...
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <InfoIcon className="w-3 h-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">
                                            {isCompleted
                                                ? `Rate updated at 10:45 AM`
                                                : "Please wait..."}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </motion.div>
                        </motion.div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
