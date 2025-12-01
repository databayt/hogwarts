"use client"

import { motion, type Easing } from "framer-motion"

// Easing values as constants
const easeInOut: Easing = "easeInOut"
const easeOut: Easing = "easeOut"

// Animation variants for the hand
const handVariants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, 2, 0, -2, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: easeInOut,
    },
  },
}

// Animation variants for nodes - staggered appearance
const nodeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.3 + i * 0.15,
      duration: 0.4,
      ease: easeOut,
    },
  }),
}

// Animation for branches
const branchVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      delay: 0.2 + i * 0.1,
      duration: 0.5,
      ease: easeOut,
    },
  }),
}

// Coral/orange color matching Anthropic
const CORAL = "#CD6C4E"
const BLACK = "#141413"

export function HeroIllustration() {
  return (
    <motion.div
      className="relative w-[280px] h-[380px] sm:w-[320px] sm:h-[420px] lg:w-[360px] lg:h-[480px]"
      initial="initial"
      animate="animate"
      variants={handVariants}
      style={{ transformOrigin: "bottom center" }}
    >
      <svg
        viewBox="0 0 300 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden="true"
      >
        {/* Tree trunk and branches */}
        <motion.g initial="hidden" animate="visible">
          {/* Main trunk */}
          <motion.path
            d="M150 380 L150 280"
            stroke={CORAL}
            strokeWidth="3"
            strokeLinecap="round"
            variants={branchVariants}
            custom={0}
          />

          {/* Branch left-1 */}
          <motion.path
            d="M150 280 L100 220"
            stroke={CORAL}
            strokeWidth="2.5"
            strokeLinecap="round"
            variants={branchVariants}
            custom={1}
          />

          {/* Branch right-1 */}
          <motion.path
            d="M150 280 L200 230"
            stroke={CORAL}
            strokeWidth="2.5"
            strokeLinecap="round"
            variants={branchVariants}
            custom={2}
          />

          {/* Branch left-2 (from left-1) */}
          <motion.path
            d="M100 220 L70 160"
            stroke={CORAL}
            strokeWidth="2"
            strokeLinecap="round"
            variants={branchVariants}
            custom={3}
          />

          {/* Branch left-3 (from left-1) */}
          <motion.path
            d="M100 220 L120 150"
            stroke={CORAL}
            strokeWidth="2"
            strokeLinecap="round"
            variants={branchVariants}
            custom={4}
          />

          {/* Branch right-2 (from right-1) */}
          <motion.path
            d="M200 230 L180 160"
            stroke={CORAL}
            strokeWidth="2"
            strokeLinecap="round"
            variants={branchVariants}
            custom={5}
          />

          {/* Branch right-3 (from right-1) */}
          <motion.path
            d="M200 230 L240 170"
            stroke={CORAL}
            strokeWidth="2"
            strokeLinecap="round"
            variants={branchVariants}
            custom={6}
          />

          {/* Top branches */}
          <motion.path
            d="M70 160 L50 100"
            stroke={CORAL}
            strokeWidth="1.5"
            strokeLinecap="round"
            variants={branchVariants}
            custom={7}
          />

          <motion.path
            d="M120 150 L130 90"
            stroke={CORAL}
            strokeWidth="1.5"
            strokeLinecap="round"
            variants={branchVariants}
            custom={8}
          />

          <motion.path
            d="M180 160 L170 95"
            stroke={CORAL}
            strokeWidth="1.5"
            strokeLinecap="round"
            variants={branchVariants}
            custom={9}
          />
        </motion.g>

        {/* Nodes (commit points) */}
        <motion.g initial="hidden" animate="visible">
          {/* Root node */}
          <motion.circle
            cx="150"
            cy="280"
            r="12"
            fill={CORAL}
            variants={nodeVariants}
            custom={0}
          />

          {/* Level 1 nodes */}
          <motion.circle
            cx="100"
            cy="220"
            r="10"
            fill={CORAL}
            variants={nodeVariants}
            custom={1}
          />
          <motion.circle
            cx="200"
            cy="230"
            r="10"
            fill={CORAL}
            variants={nodeVariants}
            custom={2}
          />

          {/* Level 2 nodes */}
          <motion.circle
            cx="70"
            cy="160"
            r="8"
            fill={CORAL}
            variants={nodeVariants}
            custom={3}
          />
          <motion.circle
            cx="120"
            cy="150"
            r="8"
            fill={CORAL}
            variants={nodeVariants}
            custom={4}
          />
          <motion.circle
            cx="180"
            cy="160"
            r="8"
            fill={CORAL}
            variants={nodeVariants}
            custom={5}
          />
          <motion.circle
            cx="240"
            cy="170"
            r="8"
            fill={CORAL}
            variants={nodeVariants}
            custom={6}
          />

          {/* Level 3 nodes (leaf nodes) */}
          <motion.circle
            cx="50"
            cy="100"
            r="6"
            fill={CORAL}
            variants={nodeVariants}
            custom={7}
          />
          <motion.circle
            cx="130"
            cy="90"
            r="6"
            fill={CORAL}
            variants={nodeVariants}
            custom={8}
          />
          <motion.circle
            cx="170"
            cy="95"
            r="6"
            fill={CORAL}
            variants={nodeVariants}
            custom={9}
          />
        </motion.g>

        {/* Hand illustration - sketch style */}
        <g>
          {/* Hand outline - palm and fingers holding the trunk */}
          <path
            d="M110 380
               C105 370, 100 360, 105 350
               C110 340, 120 335, 130 340
               L130 350
               C125 345, 120 348, 118 355
               C116 362, 118 370, 120 375
               L110 380"
            stroke={BLACK}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Thumb */}
          <path
            d="M170 350
               C175 345, 182 342, 188 348
               C194 354, 192 365, 185 372
               L180 378
               C186 370, 187 362, 183 357
               C179 352, 174 354, 170 358
               L170 350"
            stroke={BLACK}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Palm base */}
          <path
            d="M120 375
               C125 385, 140 392, 155 392
               C170 392, 178 385, 180 378"
            stroke={BLACK}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Wrist/sleeve indication */}
          <path
            d="M108 385
               Q115 400, 150 400
               Q185 400, 192 385"
            stroke={BLACK}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Additional hand details - finger wrinkles */}
          <path
            d="M125 355 Q128 358, 125 362"
            stroke={BLACK}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          <path
            d="M175 358 Q172 362, 175 366"
            stroke={BLACK}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </motion.div>
  )
}

export default HeroIllustration
