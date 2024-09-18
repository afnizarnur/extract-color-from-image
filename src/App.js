import React, { useState } from "react"
import "./App.css"

function App() {
  const [majorityColor, setMajorityColor] = useState(null)

  const getMajorityColor = (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        const colorCounts = {}
        let totalNonWhitePixels = 0
        let maxCount = 0
        let majorityColor = null

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]

          // Skip fully transparent pixels
          if (a === 0) continue

          // For semi-transparent pixels, blend with white background
          const alpha = a / 255
          const r2 = Math.round(r * alpha + 255 * (1 - alpha))
          const g2 = Math.round(g * alpha + 255 * (1 - alpha))
          const b2 = Math.round(b * alpha + 255 * (1 - alpha))

          // Ignore white or very light pixels
          if (r2 > 240 && g2 > 240 && b2 > 240) continue

          const rgb = `${r2},${g2},${b2}`

          if (colorCounts[rgb]) {
            colorCounts[rgb]++
          } else {
            colorCounts[rgb] = 1
          }

          if (colorCounts[rgb] > maxCount) {
            maxCount = colorCounts[rgb]
            majorityColor = rgb
          }

          totalNonWhitePixels++
        }

        if (majorityColor && maxCount / totalNonWhitePixels > 0.1) {
          const [r, g, b] = majorityColor.split(",").map(Number)
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)}`
          resolve(hex)
        } else {
          reject(new Error("No significant non-white color found in the image"))
        }
      }
      img.onerror = reject
      img.src = imageUrl
    })
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      try {
        const color = await getMajorityColor(imageUrl)
        setMajorityColor(color)
      } catch (error) {
        console.error("Error processing image:", error)
        setMajorityColor(null)
      }
    }
  }

  // Helper function to convert hex to RGBA
  const hexToRGBA = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Image Color Extractor</h1>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {majorityColor && (
          <div>
            <p>Majority Color: {majorityColor}</p>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "20px" }}
            >
              <div>
                <p>Original</p>
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    backgroundColor: majorityColor,
                    border: "1px solid #ccc",
                  }}
                />
                <p>{majorityColor}</p>
              </div>
              <div>
                <p>10% Opacity</p>
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    backgroundColor: hexToRGBA(majorityColor, 0.1),
                    border: "1px solid #ccc",
                  }}
                />
                <p>{hexToRGBA(majorityColor, 0.1)}</p>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  )
}

export default App
