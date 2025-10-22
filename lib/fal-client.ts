import { fal } from "@fal-ai/client"

// Configure fal client with API key
fal.config({
  credentials: process.env.FAL_KEY,
})

export { fal }

export async function generateImage(prompt: string) {
  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
      },
    })

    return result.data
  } catch (error) {
    console.error("Image generation failed:", error)
    throw error
  }
}
