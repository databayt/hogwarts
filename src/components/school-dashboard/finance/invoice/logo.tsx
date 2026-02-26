// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Image from "next/image"

export default function Logo() {
  return (
    <div>
      <Image src={"/logo.png"} alt="Generate Invoice" width={180} height={50} />
    </div>
  )
}
