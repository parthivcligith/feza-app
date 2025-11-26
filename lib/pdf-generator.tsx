import html2pdf from "html2pdf.js"

interface GeneratePDFParams {
  mattressType: "foam" | "spring"
  fabric: string
  size: string
  thicknesses?: Record<string, number>
  calculation: any
  springType?: string
  springSize?: string
  topMaterial?: string
  topThickness?: string
}

export const generatePDF = async (params: GeneratePDFParams) => {
  const { mattressType, fabric, size, calculation, springType, springSize, topMaterial, topThickness } = params

  const logoUrl = "/images/logo.jpg"

  let configHTML = ""
  if (mattressType === "foam") {
    const [length, width] = [size.substring(0, 2), size.substring(2, 4)]
    configHTML = `
      <tr><td><strong>Mattress Size:</strong></td><td>${length}" × ${width}"</td></tr>
      <tr><td><strong>Total Height:</strong></td><td>${calculation.mattressThickness} inches</td></tr>
    `
  } else {
    configHTML = `
      <tr><td><strong>Spring Size:</strong></td><td>${springSize}</td></tr>
      <tr><td><strong>Spring Type:</strong></td><td>${springType}</td></tr>
      <tr><td><strong>Total Height:</strong></td><td>${calculation.finalHeight.toFixed(1)} inches</td></tr>
      ${topThickness && Number.parseFloat(topThickness) > 0 ? `<tr><td><strong>Top Layer:</strong></td><td>${topMaterial} - ${topThickness} inches</td></tr>` : ""}
    `
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; max-width: 850px; margin: 0 auto; padding: 0; background: #faf9f7; color: #1f2937;">
      <!-- Premium Header with Logo -->
      <div style="background: linear-gradient(135deg, #008b8b 0%, #20b2aa 100%); padding: 32px 40px; margin-bottom: 0; position: relative; overflow: hidden;">
        <!-- Decorative corner accent -->
        <div style="position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
        
        <div style="display: flex; align-items: flex-start; justify-content: space-between; position: relative; z-index: 1;">
          <div>
            <img src="${logoUrl}" alt="Feza Mattresses Logo" style="height: 60px; width: auto; object-fit: contain; display: block; margin-bottom: 6px;">
            <div style="display: flex; flex-direction: column;">
              <span style="color: rgba(255,255,255,0.9); font-size: 8px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Professional</span>
              <span style="color: white; font-size: 24px; font-weight: 800; letter-spacing: -0.8px; line-height: 1.1; margin-top: 1px;">Price Quotation</span>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 6px 0; color: rgba(255,255,255,0.85); font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Premium Quotation</p>
            <p style="margin: 0; background: rgba(255,255,255,0.15); color: white; padding: 5px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; font-family: 'Courier New', monospace;">Ref: FZ-${Date.now()}</p>
          </div>
        </div>
      </div>

      <!-- Info Strip -->
      <div style="background: white; padding: 10px 40px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; border-bottom: 1px solid #e2e8f0;">
        <div><strong style="color: #008b8b;">Generated:</strong> ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
        <div style="border-left: 1px solid #cbd5e1; padding-left: 20px;"><strong style="color: #008b8b;">Time:</strong> ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
      </div>

      <!-- Main Content -->
      <div style="padding: 40px 40px; background: #faf9f7;">
        <!-- Specifications Section -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #008b8b;">
            <div style="width: 5px; height: 28px; background: #008b8b; margin-right: 14px; border-radius: 3px;"></div>
            <h2 style="margin: 0; color: #0f172a; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">Mattress Specifications</h2>
          </div>
          
          <table style="width: 100%; font-size: 11px; color: #374151;">
            <tbody>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 0; font-weight: 700; color: #0f172a; width: 45%;"><strong>Fabric Type:</strong></td>
                <td style="padding: 12px 0; text-transform: capitalize; color: #008b8b; font-weight: 600;">${fabric}</td>
              </tr>
              ${configHTML
                .split("\n")
                .filter((row) => row.trim())
                .map((row) => `<tr style="border-bottom: 1px solid #d1d5db;">${row}</tr>`)
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Cost Breakdown Section -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #008b8b;">
            <div style="width: 5px; height: 28px; background: #008b8b; margin-right: 14px; border-radius: 3px;"></div>
            <h2 style="margin: 0; color: #0f172a; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">Detailed Pricing</h2>
          </div>
          
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tbody>
              <tr style="background: #f0f9f9;">
                <td style="padding: 13px 14px; font-weight: 700; color: #008b8b; border-bottom: 2px solid #d1d5db;"><strong>${mattressType === "spring" ? "Spring Core" : "Foam Layers"}</strong></td>
                <td style="text-align: right; padding: 13px 14px; font-weight: 700; color: #008b8b; border-bottom: 2px solid #d1d5db;"><strong>₹${(mattressType === "spring" ? calculation.springCost : calculation.coreTotal).toLocaleString()}</strong></td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 11px 14px; color: #374151;">Fabric (Top + Bottom + Sides)</td>
                <td style="text-align: right; padding: 11px 14px; color: #374151; font-weight: 500;">₹${calculation.fabricTotal.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 11px 14px; color: #374151;">Packing & Packaging</td>
                <td style="text-align: right; padding: 11px 14px; color: #374151; font-weight: 500;">₹${calculation.packingPrice.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 11px 14px; color: #374151;">Gum & Beeding</td>
                <td style="text-align: right; padding: 11px 14px; color: #374151; font-weight: 500;">₹${calculation.gumBeedPrice.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 11px 14px; color: #374151;">Labour</td>
                <td style="text-align: right; padding: 11px 14px; color: #374151; font-weight: 500;">₹${calculation.labourPrice.toLocaleString()}</td>
              </tr>
              <tr style="background: #f5f3f0; border-bottom: 2px solid #d1d5db;">
                <td style="padding: 13px 14px; font-weight: 700; color: #92400e;"><strong>Margin</strong></td>
                <td style="text-align: right; padding: 13px 14px; font-weight: 700; color: #92400e;"><strong>₹${calculation.margin.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tax Summary -->
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
          <table style="width: 100%; font-size: 11px;">
            <tbody>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #475569;"><strong>Subtotal (Before Tax)</strong></td>
                <td style="text-align: right; padding: 10px 0; color: #1f2937; font-weight: 600;">₹${calculation.subtotal.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #475569;"><strong>GST (18%)</strong></td>
                <td style="text-align: right; padding: 10px 0; color: #c41e3a; font-weight: 600;">₹${calculation.gst.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #0f172a; font-weight: 800; font-size: 12px;"><strong>Cost Total</strong></td>
                <td style="text-align: right; padding: 12px 0; color: #008b8b; font-weight: 800; font-size: 12px;"><strong>₹${calculation.grandTotal.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recommended Retail Price - Premium Design -->
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fce7e6 100%); border: 3px solid #c41e3a; border-radius: 8px; padding: 32px 28px; text-align: center; margin-bottom: 32px; box-shadow: 0 8px 20px rgba(196,30,58,0.12);">
          <p style="margin: 0; color: #7f1d1d; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 2.2px;">Recommended Retail Price</p>
          <p style="margin: 14px 0 0 0; color: #c41e3a; font-size: 48px; font-weight: 900; letter-spacing: -1.2px; line-height: 1;">₹${calculation.mrp.toLocaleString()}</p>
          <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 10px; font-weight: 500; letter-spacing: 0.3px;">Suggested selling price for retail markets</p>
        </div>

        <!-- Professional Footer -->
        <div style="border-top: 2px solid #d1d5db; padding-top: 24px; text-align: center; color: #64748b; font-size: 9px;">
          <p style="margin: 0; color: #008b8b; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">✓ Professional Quotation</p>
          <p style="margin: 5px 0; line-height: 1.6; color: #6b7280;">This quotation was generated using Feza Mattresses Professional Price Calculator.<br>Valid for 30 days from the date of generation.</p>
          <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 8px;">© ${new Date().getFullYear()} Feza Mattresses. All rights reserved.</p>
        </div>
      </div>
    </div>
  `

  const element = document.createElement("div")
  element.innerHTML = html

  const opt = {
    margin: 0,
    filename: `Feza_Quotation_${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, logging: false, useCORS: true },
    jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
  }

  html2pdf().set(opt).from(element).save()
}
