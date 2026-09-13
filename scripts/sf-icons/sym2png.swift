// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Draw SF Symbols through AppKit into large black-on-white bitmaps, one per
// symbol, for `extract.py` to trace. Drawing — rather than reading the glyph's
// `CGPath` — is deliberate: many symbols (`square.and.arrow.up`, every
// `.slash`, `pip.enter`, `person.2.fill`) are built from ERASE layers, and the
// raw path concatenates those as ink. The OS applies them when it draws.
//
//   swift scripts/sf-icons/sym2png.swift <outdir> <pointSize> name:weight ...
//
// Prints one JSON line per symbol.
import AppKit

let args = CommandLine.arguments
let out = args[1]
let pt = CGFloat(Double(args[2]) ?? 1000)
let weights: [String: NSFont.Weight] = [
  "ultralight": .ultraLight, "thin": .thin, "light": .light,
  "regular": .regular, "medium": .medium, "semibold": .semibold,
  "bold": .bold, "heavy": .heavy, "black": .black,
]

for spec in args.dropFirst(3) {
  let parts = spec.split(separator: ":").map(String.init)
  let name = parts[0]
  let wname = parts.count > 1 ? parts[1] : "regular"
  let config = NSImage.SymbolConfiguration(pointSize: pt, weight: weights[wname] ?? .regular)
  guard let img = NSImage(systemSymbolName: name, accessibilityDescription: nil)?
    .withSymbolConfiguration(config)
  else {
    print("{\"name\":\"\(name)\",\"error\":\"missing\"}")
    continue
  }
  let pad: CGFloat = 40
  let w = Int(ceil(img.size.width + pad * 2))
  let h = Int(ceil(img.size.height + pad * 2))
  guard let bmp = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8,
    samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)
  else { continue }
  bmp.size = NSSize(width: w, height: h)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bmp)
  NSColor.white.setFill()
  NSRect(x: 0, y: 0, width: w, height: h).fill()
  img.draw(in: NSRect(x: pad, y: pad, width: img.size.width, height: img.size.height))
  NSGraphicsContext.restoreGraphicsState()
  let file = "\(out)/\(name)@\(wname).png"
  try! bmp.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: file))
  print("{\"name\":\"\(name)\",\"weight\":\"\(wname)\",\"pt\":\(pt),\"file\":\"\(file)\"}")
}
