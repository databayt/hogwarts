"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { HexColorInput, HexColorPicker } from "react-colorful"

interface Props {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="color-picker-container">
      <div className="color-picker-input-wrapper">
        <span className="color-picker-hash">#</span>
        <HexColorInput
          color={value}
          onChange={onChange}
          className="color-picker-input"
        />
      </div>
      <HexColorPicker
        color={value}
        onChange={onChange}
        className="color-picker"
      />
    </div>
  )
}
