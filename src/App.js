import React, { useState, useCallback } from "react"
import "./App.css"

function App() {
  const [majorityColor, setMajorityColor] = useState(null)

  const getMajorityColor = useCallback((imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)

        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        ).data
        const colorCounts = {}
        let totalNonWhitePixels = 0

        for (let i = 0; i < imageData.length; i += 4) {
          const [r, g, b, a] = imageData.slice(i, i + 4)
          if (a === 0) continue
          const r2 = Math.round(r * (a / 255) + 255 * (1 - a / 255))
          const g2 = Math.round(g * (a / 255) + 255 * (1 - a / 255))
          const b2 = Math.round(b * (a / 255) + 255 * (1 - a / 255))
          if (r2 > 240 && g2 > 240 && b2 > 240) continue
          const rgb = `${r2},${g2},${b2}`
          colorCounts[rgb] = (colorCounts[rgb] || 0) + 1
          totalNonWhitePixels++
        }

        const [majorityColor, count] = Object.entries(colorCounts).reduce(
          (max, [color, count]) => (count > max[1] ? [color, count] : max),
          ["", 0]
        )

        if (majorityColor && count / totalNonWhitePixels > 0.1) {
          const [r, g, b] = majorityColor.split(",").map(Number)
          resolve(
            `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
          )
        } else {
          reject(new Error("No significant non-white color found"))
        }
      }
      img.onerror = reject
      img.src = imageUrl
    })
  }, [])

  const handleImageUpload = useCallback(
    async (event) => {
      const file = event.target.files[0]
      if (file) {
        try {
          const color = await getMajorityColor(URL.createObjectURL(file))
          setMajorityColor(color)
        } catch (error) {
          console.error("Error processing image:", error)
          setMajorityColor(null)
        }
      }
    },
    [getMajorityColor]
  )

  const hexToRGBA = useCallback((hex, alpha) => {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }, [])

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
              {["Original", "10% Opacity"].map((label, index) => (
                <div key={label}>
                  <p>{label}</p>
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      backgroundColor:
                        index === 0
                          ? majorityColor
                          : hexToRGBA(majorityColor, 0.1),
                      border: "1px solid #ccc",
                    }}
                  />
                  <p>
                    {index === 0
                      ? majorityColor
                      : hexToRGBA(majorityColor, 0.1)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  )
}

export default App
