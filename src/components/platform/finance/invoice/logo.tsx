import Image from "next/image"

export default function Logo() {
  return (
    <div>
      <Image src={"/logo.png"} alt="Generate Invoice" width={180} height={50} />
    </div>
  )
}
