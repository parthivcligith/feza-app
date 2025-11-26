"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Settings, LogOut } from "lucide-react"
import { generatePDF } from "@/lib/pdf-generator"

const CORE_DATA = {
  "7236": { RB: 11.12, PU: 9.8, EP: 5.58, LTX: 52.76, MMRY: 38.91, SS: 11.65 },
  "7536": { RB: 11.59, PU: 10.21, EP: 5.77, LTX: 52.76, MMRY: 40.52, SS: 12.13 },
  "7248": { RB: 14.82, PU: 13.1, EP: 7.45, LTX: 70.35, MMRY: 51.5, SS: 15.42 },
  "7548": { RB: 15.44, PU: 13.61, EP: 7.74, LTX: 70.35, MMRY: 53.63, SS: 16.07 },
  "7260": { RB: 18.52, PU: 16.4, EP: 9.33, LTX: 87.93, MMRY: 64.36, SS: 19.29 },
  "7560": { RB: 19.3, PU: 17.1, EP: 9.74, LTX: 87.93, MMRY: 67.05, SS: 20.13 },
  "7272": { RB: 22.23, PU: 19.69, EP: 11.23, LTX: 105.52, MMRY: 77.23, SS: 23.19 },
  "7572": { RB: 23.16, PU: 20.5, EP: 11.7, LTX: 105.52, MMRY: 80.56, SS: 24.19 },
  "7872": { RB: 24.08, PU: 21.32, EP: 12.17, LTX: 105.52, MMRY: 84.22, SS: 25.3 },
}

const SPRING_DATA: Record<string, Record<string, number>> = {
  PKT: {
    "72x60x6": 2970,
    "72x72x6": 3528,
    "75x36x6": 1837,
    "75x48x6": 2450,
    "75x60x6": 3062,
    "83x66x6": 3600,
    "75x72x6": 3600,
    "75x72x5": 3487,
  },
  BN: {
    "72x48x5": 1577,
    "72x48x6": 1577,
    "72x60x6": 1947,
    "75x48x5": 1662,
    "72x63x5": 2099,
  },
}

const FABRIC_BASE = {
  polar: { top: 365, bottom: 200 },
  china: { top: 208, bottom: 153 },
}

const FABRIC_SIZES = {
  "7236": 1.0,
  "7536": 1.0,
  "7248": 1.29,
  "7548": 1.29,
  "7260": 1.6,
  "7560": 1.6,
  "7272": 1.88,
  "7572": 1.88,
  "7872": 2.0,
}

const CURRENT_RATES = {
  coreDisplay: {
    "7248": { RB: 14.82, PU: 13.1, EP: 7.45, LTX: 70.35, MMRY: 51.5, SS: 15.42 },
  },
  fabrics: {
    polar: { top: 365, bottom: 200 },
    china: { top: 208, bottom: 153 },
  },
}

const MATERIAL_NAMES: Record<string, string> = {
  RB: "Rebounded Foam (RB)",
  PU: "PU Foam (PU)",
  EP: "EP Foam (EP)",
  LTX: "Latex (LTX)",
  MMRY: "Memory Foam (MMRY)",
  SS: "Super Soft (SS)",
}

const calculateSide = (length: number, width: number, bottomRate: number, mattressThickness: number) => {
  const perimeterInch = (length + width) * 2
  const perimeterMeter = perimeterInch / 39.37
  const y = perimeterMeter * bottomRate
  const z = Math.floor(78 / (mattressThickness + 1))
  const sideRate = Math.ceil(y / z)
  return sideRate
}

const calculateMargin = (subtotal: number) => {
  if (subtotal < 5000) return 600
  if (subtotal < 8000) return subtotal * 0.2
  if (subtotal < 10000) return subtotal * 0.23
  if (subtotal < 12000) return subtotal * 0.25
  if (subtotal < 15000) return subtotal * 0.27
  if (subtotal < 18000) return subtotal * 0.3
  return subtotal * 0.35
}

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // The following states were moved up to fix the linting error.
  const [mattressType, setMattressType] = useState<"foam" | "spring">("foam")
  const [showRates, setShowRates] = useState(false)
  const [showRateEditor, setShowRateEditor] = useState<"materials" | "fabrics" | null>(null)
  const [showPriceListGenerator, setShowPriceListGenerator] = useState(false)

  const [editableCoreData, setEditableCoreData] = useState(CORE_DATA)
  const [editableFabricBase, setEditableFabricBase] = useState(FABRIC_BASE)

  const [fabric, setFabric] = useState("polar")
  const [size, setSize] = useState("7248")

  // Spring mattress state
  const [springType, setSpringType] = useState("PKT")
  const [springSize, setSpringSize] = useState("72x60x6")
  const [topMaterial, setTopMaterial] = useState("RB")
  const [topThickness, setTopThickness] = useState("1")

  // Foam mattress state
  const [thicknesses, setThicknesses] = useState({
    RB: 2,
    PU: 1,
    EP: 0,
    LTX: 0,
    MMRY: 0,
    SS: 0,
  })

  const calculation = useMemo(() => {
    const factor = 25

    if (mattressType === "spring") {
      const [length, width, springHeight] = springSize.split("x").map(Number)
      const topThick = Number.parseFloat(topThickness) || 0
      const finalHeight = springHeight + topThick

      const sizeKey = `${length}${width}`
      const springCost = SPRING_DATA[springType][springSize] || 0
      const topRate =
        CORE_DATA[sizeKey as keyof typeof CORE_DATA]?.[topMaterial as keyof (typeof CORE_DATA)["7248"]] || 0
      const topCost = topRate * topThick * factor

      const fabricInfo = FABRIC_BASE[fabric as keyof typeof FABRIC_BASE]
      const meters = FABRIC_SIZES[sizeKey as keyof typeof FABRIC_SIZES] || 1
      const topPrice = Math.ceil(fabricInfo.top * meters)
      const bottomPrice = Math.ceil(fabricInfo.bottom * meters)
      const sidePrice = calculateSide(length, width, fabricInfo.bottom, Math.ceil(finalHeight))
      const fabricTotal = topPrice + bottomPrice + sidePrice

      const packingPrice = finalHeight <= 6 ? 300 : 350
      const gumBeedPrice = finalHeight <= 6 ? 100 : 150
      const labourPrice = finalHeight <= 7 ? 150 : 250

      const subtotBeforeMargin = topCost + springCost + fabricTotal + packingPrice + gumBeedPrice + labourPrice
      const margin = calculateMargin(subtotBeforeMargin)

      const subtotal = subtotBeforeMargin + margin
      const gst = subtotal * 0.18
      const grandTotal = subtotal + gst
      const mrp = Math.ceil((grandTotal * 2.5) / 100) * 100

      return {
        type: "spring" as const,
        springCost,
        topCost: Math.ceil(topCost),
        fabricTotal,
        packingPrice,
        gumBeedPrice,
        labourPrice,
        margin: Math.round(margin),
        subtotal: Math.round(subtotal * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        grandTotal: Math.ceil(grandTotal),
        mrp,
        topPrice,
        bottomPrice,
        sidePrice,
        finalHeight,
      }
    } else {
      const [length, width] = [Number.parseInt(size.substring(0, 2)), Number.parseInt(size.substring(2, 4))]
      const mattressThickness = Object.values(thicknesses).reduce((a, b) => a + b, 0)

      const coreCosts: { [key: string]: number } = {}
      let coreTotal = 0
      Object.entries(thicknesses).forEach(([mat, thickness]) => {
        if (thickness > 0) {
          const cost = (CORE_DATA[size as keyof typeof CORE_DATA] as any)[mat] * thickness * factor
          coreCosts[mat] = Math.ceil(cost)
          coreTotal += cost
        }
      })

      const fabricInfo = FABRIC_BASE[fabric as keyof typeof FABRIC_BASE]
      const meters = FABRIC_SIZES[size as keyof typeof FABRIC_SIZES]
      const topPrice = Math.ceil(fabricInfo.top * meters)
      const bottomPrice = Math.ceil(fabricInfo.bottom * meters)
      const sidePrice = calculateSide(length, width, fabricInfo.bottom, mattressThickness)
      const fabricTotal = topPrice + bottomPrice + sidePrice

      const packingPrice = mattressThickness <= 6 ? 300 : 350
      const gumBeedPrice = mattressThickness <= 6 ? 100 : 150
      const labourPrice = mattressThickness <= 7 ? 150 : 250

      const subtotBeforeMargin = coreTotal + fabricTotal + packingPrice + gumBeedPrice + labourPrice
      const margin = calculateMargin(subtotBeforeMargin)

      const subtotal = subtotBeforeMargin + margin
      const gst = subtotal * 0.18
      const grandTotal = subtotal + gst
      const mrp = Math.ceil((grandTotal * 2.5) / 100) * 100

      return {
        type: "foam" as const,
        coreCosts,
        coreTotal: Math.ceil(coreTotal),
        fabricTotal,
        packingPrice,
        gumBeedPrice,
        labourPrice,
        margin: Math.round(margin),
        subtotal: Math.round(subtotal * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        grandTotal: Math.ceil(grandTotal),
        mrp,
        topPrice,
        bottomPrice,
        sidePrice,
        mattressThickness,
      }
    }
  }, [mattressType, fabric, size, springType, springSize, topMaterial, topThickness, thicknesses])

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
    setIsCheckingAuth(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    router.push("/login")
  }

  if (isCheckingAuth || !isAuthenticated) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50" />
  }

  const handleThicknessChange = (material: string, value: string) => {
    setThicknesses((prev) => ({
      ...prev,
      [material]: Number.parseInt(value) || 0,
    }))
  }

  const handleUpdateMaterialRate = (size: string, material: string, newRate: string) => {
    setEditableCoreData((prev) => ({
      ...prev,
      [size]: {
        ...prev[size as keyof typeof prev],
        [material]: Number.parseFloat(newRate) || 0,
      },
    }))
  }

  const handleUpdateFabricRate = (fabricType: string, rateType: "top" | "bottom", newRate: string) => {
    setEditableFabricBase((prev) => ({
      ...prev,
      [fabricType]: {
        ...prev[fabricType as keyof typeof prev],
        [rateType]: Number.parseFloat(newRate) || 0,
      },
    }))
  }

  const handleGeneratePriceList = async () => {
    const element = document.createElement("div")
    element.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: white; }
        .container { padding: 20px; max-width: 1200px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #00a8cc; padding-bottom: 15px; }
        .brand-section { flex: 1; }
        .brand-name { font-size: 28px; font-weight: bold; color: #00a8cc; margin-bottom: 5px; }
        .brand-subtitle { font-size: 14px; color: #666; }
        .date-section { text-align: right; font-size: 12px; color: #999; }
        h2 { font-size: 18px; color: #00a8cc; margin-bottom: 15px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: avoid; }
        thead { background: linear-gradient(135deg, #00a8cc, #0086aa); }
        th { color: white; padding: 12px; text-align: left; font-weight: 600; font-size: 13px; }
        td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #e0e0e0; }
        tbody tr:hover { background-color: #f5f5f5; }
        tbody tr:nth-child(even) { background-color: #fafafa; }
        .serial { width: 5%; text-align: center; }
        .size { width: 12%; font-weight: 500; }
        .fabric { width: 12%; }
        .structure { width: 30%; }
        .mrp { width: 15%; text-align: right; font-weight: 600; color: #d32f2f; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #e0e0e0; padding-top: 15px; }
        .page-break { page-break-after: always; }
      </style>
      <div class="container">
        <div class="header">
          <div class="brand-section">
            <div class="brand-name">JEZA MATTRESSES</div>
            <div class="brand-subtitle">Complete Price List - Foam Mattresses</div>
          </div>
          <div class="date-section">
            <div>Generated: ${new Date().toLocaleDateString()}</div>
            <div>Version: ${new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="serial">No.</th>
              <th class="size">Size</th>
              <th class="fabric">Fabric</th>
              <th class="structure">Structure</th>
              <th class="mrp">MRP</th>
            </tr>
          </thead>
          <tbody id="priceTableBody">
          </tbody>
        </table>

        <div class="footer">
          <p>© Jeza Mattresses | All rights reserved | Confidential</p>
          <p>For enquiries: contact@jezamattresses.com</p>
        </div>
      </div>
    `

    let serial = 1
    const tbody = element.querySelector("#priceTableBody")

    const sizes = [
      { key: "7236", display: "72x36" },
      { key: "7248", display: "72x48" },
      { key: "7260", display: "72x60" },
      { key: "7272", display: "72x72" },
      { key: "7536", display: "75x36" },
      { key: "7548", display: "75x48" },
      { key: "7560", display: "75x60" },
      { key: "7572", display: "75x72" },
      { key: "7872", display: "78x72" },
    ]

    for (let h = 4; h <= 10; h++) {
      for (const size of sizes) {
        const sizeKey = size.key as keyof typeof editableCoreData
        const coreData = editableCoreData[sizeKey]
        if (!coreData) continue

        const factor = 25
        const rbCost = (coreData.RB || 0) * 2 * factor
        const puCost = (coreData.PU || 0) * 1 * factor
        const coreTotal = rbCost + puCost

        const fabricInfo = editableFabricBase.polar
        const meters = (FABRIC_SIZES as any)[sizeKey] || 1
        const [length, width] = [
          Number.parseInt(size.display.split("x")[0]),
          Number.parseInt(size.display.split("x")[1]),
        ]
        const topPrice = Math.ceil(fabricInfo.top * meters)
        const bottomPrice = Math.ceil(fabricInfo.bottom * meters)
        const sidePrice = calculateSide(length, width, fabricInfo.bottom, h)
        const fabricTotal = topPrice + bottomPrice + sidePrice

        const packingPrice = h <= 6 ? 300 : 350
        const gumBeedPrice = h <= 6 ? 100 : 150
        const labourPrice = h <= 7 ? 150 : 250

        const subtotBeforeMargin = coreTotal + fabricTotal + packingPrice + gumBeedPrice + labourPrice
        const margin = calculateMargin(subtotBeforeMargin)
        const subtotal = subtotBeforeMargin + margin
        const gst = subtotal * 0.18
        const grandTotal = subtotal + gst
        const mrp = Math.ceil((grandTotal * 2.5) / 100) * 100

        const row = document.createElement("tr")
        row.innerHTML = `
          <td class="serial">${serial}</td>
          <td class="size">${size.display}x${h}\"</td>
          <td class="fabric">Polar</td>
          <td class="structure">RB 2" + PU 1"</td>
          <td class="mrp">₹${mrp.toLocaleString()}</td>
        `
        tbody?.appendChild(row)
        serial++
      }
    }

    const opt = {
      margin: [10, 10, 10, 10],
      filename: "Jeza_Mattresses_Price_List.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: "landscape", unit: "mm", format: "a4" },
    }

    const html2pdf = (await import("html2pdf.js")).default
    html2pdf().set(opt).from(element).save()
    setShowPriceListGenerator(false)
  }

  const handleDownloadPDF = async () => {
    generatePDF({
      mattressType,
      fabric,
      size,
      thicknesses,
      calculation,
      springType,
      springSize,
      topMaterial,
      topThickness,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Jeza Mattresses" width={200} height={70} className="h-14 w-auto" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setShowRates(!showRates)}
              variant="outline"
              className="text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              View Rates
            </Button>
            <Button
              onClick={() => setShowRateEditor("materials")}
              variant="outline"
              className="text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              Material Rates
            </Button>
            <Button
              onClick={() => setShowRateEditor("fabrics")}
              variant="outline"
              className="text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              Fabric Rates
            </Button>
            <Button
              onClick={handleGeneratePriceList}
              variant="outline"
              className="text-slate-700 border-slate-300 hover:bg-slate-100 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Price List PDF
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Quote PDF
            </Button>
            <Button onClick={handleLogout} variant="destructive" className="font-semibold shadow-md">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {showRateEditor === "materials" && (
          <div className="mb-8 bg-white rounded-lg shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Update Material Rates</h2>
              <Button onClick={() => setShowRateEditor(null)} variant="ghost">
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(editableCoreData).map(([sizeKey, materials]) => (
                <Card key={sizeKey} className="border-slate-200">
                  <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 pb-3">
                    <CardTitle className="text-base">
                      {sizeKey.substring(0, 2)}&quot; × {sizeKey.substring(2)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {Object.entries(materials).map(([material, rate]) => (
                      <div key={material} className="flex items-center gap-3">
                        <Label className="w-32 font-semibold text-slate-700">
                          {MATERIAL_NAMES[material as keyof typeof MATERIAL_NAMES] || material}
                        </Label>
                        <Input
                          type="number"
                          value={rate}
                          onChange={(e) => handleUpdateMaterialRate(sizeKey, material, e.target.value)}
                          className="flex-1"
                          step="0.01"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showRateEditor === "fabrics" && (
          <div className="mb-8 bg-white rounded-lg shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Update Fabric Rates</h2>
              <Button onClick={() => setShowRateEditor(null)} variant="ghost">
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(editableFabricBase).map(([fabricType, rates]) => (
                <Card key={fabricType} className="border-slate-200">
                  <CardHeader className="bg-cyan-50 pb-3">
                    <CardTitle className="text-base capitalize">{fabricType} Fabric</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <Label className="font-semibold text-slate-700 mb-2 block">Top Rate (per meter)</Label>
                      <Input
                        type="number"
                        value={rates.top}
                        onChange={(e) => handleUpdateFabricRate(fabricType, "top", e.target.value)}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-700 mb-2 block">Bottom Rate (per meter)</Label>
                      <Input
                        type="number"
                        value={rates.bottom}
                        onChange={(e) => handleUpdateFabricRate(fabricType, "bottom", e.target.value)}
                        step="0.01"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showRates && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Materials Rates */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-500 text-white pb-4 rounded-t-lg">
                <CardTitle className="text-lg">Current Rates - Core Materials</CardTitle>
                <CardDescription className="text-teal-50 text-sm">(Base size: 72x48 x 1 inch)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {Object.entries(CURRENT_RATES.coreDisplay["7248"]).map(([mat, rate]) => (
                    <div
                      key={mat}
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <span className="font-semibold text-slate-700">
                        {MATERIAL_NAMES[mat as keyof typeof MATERIAL_NAMES] || mat}
                      </span>
                      <span className="font-bold text-teal-600">₹{rate}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fabric Rates */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white pb-4 rounded-t-lg">
                <CardTitle className="text-lg">Current Rates - Fabrics</CardTitle>
                <CardDescription className="text-cyan-50 text-sm">Per square meter pricing</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Object.entries(CURRENT_RATES.fabrics).map(([fabricType, prices]) => (
                    <div key={fabricType} className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                      <p className="font-bold text-slate-900 mb-3 capitalize">{fabricType} Fabric</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-sm">Top (24mm)</span>
                          <span className="font-semibold text-cyan-600">₹{prices.top}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-sm">Bottom (8mm)</span>
                          <span className="font-semibold text-cyan-600">₹{prices.bottom}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Mattress Price Calculator</h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Configure your mattress specifications and instantly calculate production costs, pricing, and retail MRP
          </p>
        </div>

        {/* System Features - Dashboard Overview */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel - Left Side */}
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-6">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-t-lg pb-4 rounded-xl pt-0 mx-[21px]">
                  <CardTitle className="text-xl text-center">Mattress Type</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setMattressType("foam")}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        mattressType === "foam"
                          ? "bg-cyan-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Foam Mattress
                    </button>
                    <button
                      onClick={() => setMattressType("spring")}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        mattressType === "spring"
                          ? "bg-cyan-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Spring Mattress
                    </button>
                  </div>
                </CardContent>
              </Card>

              {mattressType === "foam" ? (
                <>
                  {/* Basic Settings */}
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-t-lg pb-4 rounded-xl pt-0 mx-[25px]">
                      <CardTitle className="text-xl text-center">Mattress Specifications</CardTitle>
                      <CardDescription className="text-cyan-50 text-sm text-center">
                        Select size and fabric type
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="fabric" className="font-semibold text-slate-700">
                            Fabric Type
                          </Label>
                          <Select value={fabric} onValueChange={setFabric}>
                            <SelectTrigger id="fabric" className="h-11 border-slate-200 focus:ring-cyan-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="polar">Polar Fabric</SelectItem>
                              <SelectItem value="china">China Fabric</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="size" className="font-semibold text-slate-700">
                            Mattress Size
                          </Label>
                          <Select value={size} onValueChange={setSize}>
                            <SelectTrigger id="size" className="h-11 border-slate-200 focus:ring-cyan-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(CORE_DATA).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.substring(0, 2)}&quot; × {s.substring(2, 4)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Material Configuration */}
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-t-lg pb-4 mx-[25px] rounded-lg">
                      <CardTitle className="text-xl text-center">Core Materials</CardTitle>
                      <CardDescription className="text-teal-50 text-sm text-center">
                        Specify thickness in inches for each material
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.keys(CORE_DATA[size as keyof typeof CORE_DATA]).map((mat) => (
                          <div key={mat} className="space-y-2">
                            <Label htmlFor={mat} className="font-semibold text-sm text-slate-700">
                              {mat === "RB" && "Rubber Base"}
                              {mat === "PU" && "Polyurethane"}
                              {mat === "EP" && "(EP)"}
                              {mat === "LTX" && "Latex"}
                              {mat === "MMRY" && "Memory"}
                              {mat === "SS" && "Super Soft"}
                            </Label>
                            <Input
                              id={mat}
                              type="number"
                              min="0"
                              max="10"
                              value={thicknesses[mat as keyof typeof thicknesses]}
                              onChange={(e) => handleThicknessChange(mat, e.target.value)}
                              className="h-10 border-slate-200 focus:ring-teal-500"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* Spring Configuration */}
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-t-lg pb-4">
                      <CardTitle className="text-xl">Spring Configuration</CardTitle>
                      <CardDescription className="text-cyan-50 text-sm">Configure spring and top layer</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="spring-type" className="font-semibold text-slate-700">
                            Spring Type
                          </Label>
                          <Select value={springType} onValueChange={setSpringType}>
                            <SelectTrigger id="spring-type" className="h-11 border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PKT">Pocket Spring (PKT)</SelectItem>
                              <SelectItem value="BN">Bonnel Spring (BN)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="spring-size" className="font-semibold text-slate-700">
                            Spring Size
                          </Label>
                          <Select value={springSize} onValueChange={setSpringSize}>
                            <SelectTrigger id="spring-size" className="h-11 border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(SPRING_DATA[springType] || {}).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fabric-spring" className="font-semibold text-slate-700">
                            Fabric Type
                          </Label>
                          <Select value={fabric} onValueChange={setFabric}>
                            <SelectTrigger id="fabric-spring" className="h-11 border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="polar">Polar Fabric</SelectItem>
                              <SelectItem value="china">China Fabric</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Layer Configuration */}
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-t-lg pb-4">
                      <CardTitle className="text-xl">Top Layer</CardTitle>
                      <CardDescription className="text-teal-50 text-sm">
                        Add optional top layer material
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="top-material" className="font-semibold text-slate-700">
                            Top Material
                          </Label>
                          <Select value={topMaterial} onValueChange={setTopMaterial}>
                            <SelectTrigger id="top-material" className="h-11 border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RB">Rubber Base</SelectItem>
                              <SelectItem value="PU">Polyurethane</SelectItem>
                              <SelectItem value="EP">(EP)</SelectItem>
                              <SelectItem value="LTX">Latex</SelectItem>
                              <SelectItem value="MMRY">Memory Foam</SelectItem>
                              <SelectItem value="SS">Super Soft</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="top-thickness" className="font-semibold text-slate-700">
                            Thickness (inches)
                          </Label>
                          <Input
                            id="top-thickness"
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={topThickness}
                            onChange={(e) => setTopThickness(e.target.value)}
                            className="h-11 border-slate-200"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Price Summary Card - Right Side */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl sticky top-24 bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-t-lg pb-4 rounded-lg mx-[25px]">
                <CardTitle className="text-xl text-center">Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline text-sm border-b border-slate-100 pb-3">
                    <span className="text-slate-600 font-medium">Subtotal</span>
                    <span className="font-semibold text-lg text-slate-900">
                      ₹{calculation.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-sm border-b border-slate-100 pb-3">
                    <span className="text-slate-600 font-medium">GST (18%)</span>
                    <span className="font-semibold text-lg text-emerald-600">₹{calculation.gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-sm pb-3">
                    <span className="text-slate-700 font-semibold">Cost Total</span>
                    <span className="font-bold text-xl text-cyan-600">₹{calculation.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 mt-4">
                    <p className="text-xs text-red-700 font-bold uppercase tracking-wide mb-1">Retail MRP</p>
                    <p className="text-3xl font-black text-red-600">₹{calculation.mrp.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {/* Core/Spring Materials */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                {mattressType === "spring" ? "Spring Cost" : "Core Materials"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {mattressType === "spring" ? (
                <>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-600 text-sm font-medium">{springType} Spring</span>
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 font-semibold">
                      ₹{calculation.type === "spring" && calculation.springCost.toLocaleString()}
                    </Badge>
                  </div>
                  {calculation.type === "spring" && calculation.topCost > 0 && (
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-600 text-sm font-medium">{topMaterial} Top</span>
                      <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 font-semibold">
                        ₹{calculation.topCost.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                calculation.type === "foam" &&
                Object.entries(calculation.coreCosts).map(([mat, cost]) => (
                  <div key={mat} className="flex justify-between items-center py-1.5">
                    <span className="text-slate-600 text-sm font-medium">{mat}</span>
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 font-semibold">
                      ₹{cost.toLocaleString()}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Fabric Details */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                Fabric Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 text-sm font-medium">Top Fabric</span>
                <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 font-semibold">
                  ₹{calculation.topPrice.toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 text-sm font-medium">Bottom Fabric</span>
                <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 font-semibold">
                  ₹{calculation.bottomPrice.toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 text-sm font-medium">Side Binding</span>
                <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 font-semibold">
                  ₹{calculation.sidePrice.toLocaleString()}
                </Badge>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2 font-semibold text-slate-900 flex justify-between">
                <span>Subtotal</span>
                <span className="text-cyan-600 font-bold">₹{calculation.fabricTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Additional Charges */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Additional Charges
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 text-sm font-medium">Packing</span>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-semibold">
                  ₹{calculation.packingPrice.toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 text-sm font-medium">Gum & Beeding</span>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-semibold">
                  ₹{calculation.gumBeedPrice.toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 text-sm font-medium">Labour</span>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-semibold">
                  ₹{calculation.labourPrice.toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-t border-slate-100 pt-2">
                <span className="text-slate-600 text-sm font-medium">Margin</span>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-semibold">
                  ₹{calculation.margin.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Summary */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {mattressType === "foam" ? (
                <>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Dimensions</p>
                    <p className="text-lg font-bold text-slate-900">
                      {size.substring(0, 2)}&quot; × {size.substring(2, 4)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Height</p>
                    <p className="text-lg font-bold text-slate-900">
                      {calculation.type === "foam" ? calculation.mattressThickness : 0} inches
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Spring Size</p>
                    <p className="text-lg font-bold text-slate-900">{springSize}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Height</p>
                    <p className="text-lg font-bold text-slate-900">
                      {calculation.type === "spring" ? calculation.finalHeight.toFixed(1) : 0} inches
                    </p>
                  </div>
                </>
              )}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fabric Type</p>
                <p className="text-lg font-bold capitalize text-slate-900">{fabric}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
