import express from "express"
import fs from "fs"
import { exec } from "child_process"
import fetch from "node-fetch"

const app = express()
app.use(express.json({ limit: "50mb" }))

const PORT = 3000

// Security Middleware
app.use((req, res, next) => {
    // Skip auth for health checks if needed, or enforce strict
    if (req.path === '/') return next();

    if (process.env.SECRET_TOKEN && req.headers.authorization !== process.env.SECRET_TOKEN) {
        return res.status(403).send("Forbidden")
    }
    next()
})

app.get('/', (req, res) => res.send('Blender API Ready'))

app.post("/convert", async (req, res) => {
    const { inputUrl } = req.body

    if (!inputUrl) return res.status(400).send("Missing inputUrl")

    try {
        const inputPath = "/tmp/input.usdz"
        const outputPath = "/tmp/output.glb"

        // Clean up previous files
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)

        console.log(`Fetching: ${inputUrl}`)
        const response = await fetch(inputUrl)
        if (!response.ok) throw new Error(`Failed to fetch input: ${response.statusText}`)

        const buffer = Buffer.from(await response.arrayBuffer())

        // Safety check size
        if (buffer.length > 50_000_000) { // 50MB limit
            return res.status(400).send("File too large (>50MB)")
        }

        fs.writeFileSync(inputPath, buffer)

        console.log("Starting Blender conversion...")
        exec(
            `blender -b -P convert.py -- ${inputPath} ${outputPath}`,
            (err, stdout, stderr) => {
                if (err) {
                    console.error("Blender Error:", stderr)
                    // Cleanup on error
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
                    return res.status(500).send("Conversion process failed")
                }

                if (!fs.existsSync(outputPath)) {
                    console.error("Output not found")
                    // Cleanup input
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
                    return res.status(500).send("Output GLB not generated")
                }

                try {
                    const file = fs.readFileSync(outputPath)
                    res.setHeader("Content-Type", "model/gltf-binary")
                    res.send(file)
                    console.log("Conversion successful")
                } catch (e) {
                    console.error("Send Error:", e)
                    res.status(500).send("Error sending file")
                } finally {
                    // Always cleanup
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
                }
            }
        )
    } catch (e) {
        console.error(e)
        res.status(500).send(e.message)
    }
})

app.listen(PORT, () => console.log(`Blender API running on port ${PORT}`))
