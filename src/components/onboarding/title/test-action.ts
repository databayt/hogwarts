"use server"

// Ultra-minimal test action with NO imports
export async function testAction(): Promise<{
  success: boolean
  message: string
}> {
  console.log("🧪 [TEST ACTION] Called at", new Date().toISOString())
  return {
    success: true,
    message: "Test action works!",
  }
}
