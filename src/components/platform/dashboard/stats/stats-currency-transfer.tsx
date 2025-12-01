"use client"

import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, InfoIcon, ArrowUpDown, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function StatsCurrencyTransfer() {
  const [isCompleted, setIsCompleted] = useState(false)
  const transactionId = "TXN-DAB3UL494"

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCompleted(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <TooltipProvider>
      <Card className="mx-auto flex h-[420px] w-full max-w-sm flex-col p-6">
        <CardContent className="flex flex-1 flex-col justify-center space-y-4">
          <div className="flex h-[80px] items-center justify-center">
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative flex h-[100px] w-[100px] items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-500/10 blur-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.8] }}
                  transition={{ duration: 1.5, times: [0, 0.5, 1], ease: [0.22, 1, 0.36, 1] }}
                />
                <AnimatePresence mode="wait">
                  {!isCompleted ? (
                    <motion.div
                      key="progress"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, rotate: 360 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="flex h-[100px] w-[100px] items-center justify-center"
                    >
                      <div className="relative z-10">
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-transparent"
                          style={{
                            borderLeftColor: "rgb(16 185 129)",
                            borderTopColor: "rgb(16 185 129 / 0.2)",
                            filter: "blur(0.5px)",
                          }}
                          animate={{ rotate: 360, scale: [1, 1.02, 1] }}
                          transition={{
                            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                          }}
                        />
                        <div className="relative z-10 rounded-full bg-card p-5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                          <ArrowUpDown className="h-10 w-10 text-emerald-500" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="completed"
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="flex h-[100px] w-[100px] items-center justify-center"
                    >
                      <div className="relative z-10 rounded-full border border-emerald-500 bg-card p-5">
                        <Check className="h-10 w-10 text-emerald-500" strokeWidth={3.5} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
          <div className="flex h-[280px] flex-col">
            <motion.div
              className="mb-4 w-full space-y-2 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.h2
                    key="completed-title"
                    className="text-lg font-semibold uppercase tracking-tighter text-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Transfer Completed
                  </motion.h2>
                ) : (
                  <motion.h2
                    key="progress-title"
                    className="text-lg font-semibold uppercase tracking-tighter text-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Transfer in Progress
                  </motion.h2>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="completed-id"
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Transaction ID: {transactionId}
                  </motion.div>
                ) : (
                  <motion.div
                    key="progress-status"
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Processing Transaction...
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-4 flex items-center gap-4">
                <motion.div
                  className="relative flex-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    className="relative flex flex-col items-start"
                    initial={{ gap: "12px" }}
                    animate={{ gap: isCompleted ? "0px" : "12px" }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <motion.div
                      className={cn(
                        "w-full rounded-xl border bg-muted/50 p-2.5 backdrop-blur-md transition-all duration-300",
                        isCompleted ? "rounded-b-none border-b-0" : "hover:border-emerald-500/30"
                      )}
                    >
                      <div className="w-full space-y-1">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <ArrowUpIcon className="h-3 w-3" />
                          From
                        </span>
                        <div className="flex flex-col gap-1.5">
                          <div className="group flex items-center gap-2.5">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-card text-sm font-medium shadow-lg">
                              $
                            </span>
                            <div className="flex flex-col items-start">
                              <span
                                className={cn(
                                  "font-medium tracking-tight text-foreground",
                                  !isCompleted && "opacity-50"
                                )}
                              >
                                500.00 USD
                              </span>
                              <span className="text-xs text-muted-foreground">Chase Bank ••••4589</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className={cn(
                        "w-full rounded-xl border bg-muted/50 p-2.5 backdrop-blur-md transition-all duration-300",
                        isCompleted ? "rounded-t-none border-t-0" : "hover:border-emerald-500/30"
                      )}
                    >
                      <div className="w-full space-y-1">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <ArrowDownIcon className="h-3 w-3" />
                          To
                        </span>
                        <div className="flex flex-col gap-1.5">
                          <div className="group flex items-center gap-2.5">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-card text-sm font-medium shadow-lg">
                              €
                            </span>
                            <div className="flex flex-col items-start">
                              <span
                                className={cn(
                                  "font-medium tracking-tight text-foreground",
                                  !isCompleted && "opacity-50"
                                )}
                              >
                                460.00 EUR
                              </span>
                              <span className="text-xs text-muted-foreground">Deutsche Bank ••••7823</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>
              <motion.div
                className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.span
                      key="completed-rate"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      Exchange Rate: 1 USD = 0.92 EUR
                    </motion.span>
                  ) : (
                    <motion.span
                      key="calculating-rate"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      Calculating exchange rate...
                    </motion.span>
                  )}
                </AnimatePresence>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-3 w-3 text-muted-foreground transition-colors hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{isCompleted ? `Rate updated at 10:45 AM` : "Please wait..."}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
