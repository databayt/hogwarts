import bcrypt from "bcryptjs"

async function main() {
  const password = "1234"
  const hash = await bcrypt.hash(password, 10)
  console.log("\nBcrypt hash for password '1234':")
  console.log(hash)
  console.log("\nUse this hash in the SQL INSERT statement")
}

main()
