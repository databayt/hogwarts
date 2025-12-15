import {
  Geist_Mono as FontMono,
  Geist as FontSans,
  Rubik,
} from "next/font/google"

import { cn } from "@/lib/utils"

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
})

export const fontRubik = Rubik({
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
})

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontRubik.variable
)
