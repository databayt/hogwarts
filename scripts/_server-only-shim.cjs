// Lets a tsx one-off import Next-only modules ("server-only", "react-server"
// conditions) outside Next. Register with: node -r ./scripts/_server-only-shim.cjs
const Module = require("node:module")
const orig = Module._resolveFilename
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only" || request === "client-only") return require.resolve("./_empty.cjs")
  return orig.call(this, request, ...rest)
}
