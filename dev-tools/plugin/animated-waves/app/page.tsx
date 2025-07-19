"use client"

import { useState } from "react"
import Waves from "@/components/Waves"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

export default function WavesDemo() {
  const [config, setConfig] = useState({
    lineColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "#0f172a",
    waveSpeedX: 0.0125,
    waveSpeedY: 0.005,
    waveAmpX: 32,
    waveAmpY: 16,
    xGap: 10,
    yGap: 32,
    friction: 0.925,
    tension: 0.005,
    maxCursorMove: 100,
  })

  const [showControls, setShowControls] = useState(false)

  const presets = [
    {
      name: "Ocean Waves",
      config: {
        ...config,
        lineColor: "rgba(59, 130, 246, 0.4)",
        backgroundColor: "#0c4a6e",
        waveAmpX: 40,
        waveAmpY: 20,
        waveSpeedX: 0.01,
        waveSpeedY: 0.008,
      },
    },
    {
      name: "Electric Grid",
      config: {
        ...config,
        lineColor: "rgba(34, 197, 94, 0.6)",
        backgroundColor: "#000000",
        xGap: 15,
        yGap: 15,
        waveAmpX: 20,
        waveAmpY: 20,
      },
    },
    {
      name: "Sunset Ripples",
      config: {
        ...config,
        lineColor: "rgba(251, 146, 60, 0.5)",
        backgroundColor: "#7c2d12",
        waveAmpX: 50,
        waveAmpY: 10,
        waveSpeedX: 0.02,
      },
    },
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Waves {...config} />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Interactive Waves
          </h1>
          <p className="text-xl text-gray-300 mb-8">Move your mouse to interact with the wave field</p>

          <div className="flex gap-4 justify-center mb-8">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                onClick={() => setConfig(preset.config)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {preset.name}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => setShowControls(!showControls)}
            className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
          >
            {showControls ? "Hide Controls" : "Show Controls"}
          </Button>
        </div>

        {showControls && (
          <Card className="w-96 bg-black/50 border-white/20 text-white">
            <CardHeader>
              <CardTitle>Wave Controls</CardTitle>
              <CardDescription className="text-gray-300">Adjust the wave parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Wave Amplitude X: {config.waveAmpX}</label>
                <Slider
                  value={[config.waveAmpX]}
                  onValueChange={([value]) => setConfig({ ...config, waveAmpX: value })}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Wave Amplitude Y: {config.waveAmpY}</label>
                <Slider
                  value={[config.waveAmpY]}
                  onValueChange={([value]) => setConfig({ ...config, waveAmpY: value })}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Wave Speed X: {config.waveSpeedX.toFixed(4)}</label>
                <Slider
                  value={[config.waveSpeedX * 1000]}
                  onValueChange={([value]) => setConfig({ ...config, waveSpeedX: value / 1000 })}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Grid Gap X: {config.xGap}</label>
                <Slider
                  value={[config.xGap]}
                  onValueChange={([value]) => setConfig({ ...config, xGap: value })}
                  max={50}
                  min={5}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Grid Gap Y: {config.yGap}</label>
                <Slider
                  value={[config.yGap]}
                  onValueChange={([value]) => setConfig({ ...config, yGap: value })}
                  max={100}
                  min={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
