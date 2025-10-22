import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, reportData } = body

    console.log(`📄 Generating PDF export for report ID: ${reportId}`)
    console.log(`📊 Report data summary:`, {
      patientName: reportData?.patientInfo?.name,
      confidence: reportData?.aiAnalysis?.confidence,
      revenueIncrease: reportData?.revenueAnalysis?.revenueIncrease,
      hasCorrections: !!reportData?.aiAnalysis?.corrections?.length
    })

    if (!reportData) {
      console.error("❌ No report data provided for PDF export")
      return NextResponse.json({ error: "Report data is required" }, { status: 400 })
    }

    // Validate essential data
    if (!reportData.patientInfo || !reportData.aiAnalysis || !reportData.revenueAnalysis) {
      console.error("❌ Incomplete report data structure:", {
        hasPatientInfo: !!reportData.patientInfo,
        hasAiAnalysis: !!reportData.aiAnalysis,
        hasRevenueAnalysis: !!reportData.revenueAnalysis
      })
      return NextResponse.json({ error: "Incomplete report data structure" }, { status: 400 })
    }

    // Generate comprehensive PDF content
    const pdfContent = generatePDFContent(reportData)

    // In a real implementation, you would use a PDF generation library like puppeteer, jsPDF, or PDFKit
    // For now, we'll create a structured HTML that can be converted to PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>OASIS Optimization Report</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2563eb;
            margin-bottom: 5px;
        }
        .report-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .chart-info { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px;
        }
        .info-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 15px; 
            margin-bottom: 20px;
        }
        .info-item { 
            padding: 10px; 
            border: 1px solid #e5e7eb;
            border-radius: 4px;
        }
        .info-label { 
            font-weight: bold; 
            color: #6b7280; 
            font-size: 12px; 
            margin-bottom: 5px;
        }
        .info-value { 
            font-size: 14px; 
            font-weight: 600;
        }
        .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin: 30px 0 15px 0; 
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 15px; 
            margin-bottom: 20px;
        }
        .metric-card { 
            text-align: center; 
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px;
            background: #f9fafb;
        }
        .metric-value { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px;
        }
        .metric-label { 
            font-size: 12px; 
            color: #6b7280;
        }
        .confidence { color: #059669; }
        .quality { color: #2563eb; }
        .revenue { color: #dc2626; }
        .processing { color: #7c3aed; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            font-size: 12px;
        }
        th, td { 
            border: 1px solid #e5e7eb; 
            padding: 8px; 
            text-align: left;
        }
        th { 
            background: #f3f4f6; 
            font-weight: bold;
        }
        .highlight-row { 
            background: #fef3c7;
        }
        .revenue-row { 
            background: #dcfce7; 
            font-weight: bold;
        }
        .correction-item { 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        .correction-header { 
            font-weight: bold; 
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .severity-badge { 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 10px; 
            font-weight: bold;
        }
        .severity-critical { background: #fee2e2; color: #991b1b; }
        .severity-high { background: #fed7aa; color: #9a3412; }
        .severity-medium { background: #fef3c7; color: #92400e; }
        .severity-low { background: #dbeafe; color: #1e40af; }
        .correction-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px; 
            margin: 10px 0;
        }
        .current-value { 
            background: #fee2e2; 
            padding: 10px; 
            border-radius: 4px;
        }
        .suggested-value { 
            background: #dcfce7; 
            padding: 10px; 
            border-radius: 4px;
        }
        .rationale { 
            background: #dbeafe; 
            padding: 10px; 
            border-radius: 4px; 
            margin: 10px 0;
        }
        .impact { 
            background: #f3e8ff; 
            padding: 10px; 
            border-radius: 4px;
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            font-size: 11px; 
            color: #6b7280;
        }
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Compassionate Home Health Services, Inc.</div>
        <div class="report-title">OASIS OPTIMIZATION REPORT</div>
        <div style="font-size: 14px; color: #6b7280;">Generated on ${new Date().toLocaleDateString()}</div>
    </div>

    <div class="chart-info">
        <h3 style="margin-top: 0;">CHART INFO</h3>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Patient Name</div>
                <div class="info-value">${reportData.patientInfo.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">MRN</div>
                <div class="info-value">${reportData.patientInfo.mrn}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Visit Type</div>
                <div class="info-value">${reportData.patientInfo.visitType}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Payor</div>
                <div class="info-value">${reportData.patientInfo.payor}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Visit Date</div>
                <div class="info-value">${reportData.patientInfo.visitDate}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Clinician</div>
                <div class="info-value">${reportData.patientInfo.clinician}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Pay Period</div>
                <div class="info-value">${reportData.patientInfo.payPeriod}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">${reportData.patientInfo.status}</div>
            </div>
        </div>
    </div>

    <div class="section-title">AI ANALYSIS SUMMARY</div>
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value confidence">${reportData.aiAnalysis.confidence}%</div>
            <div class="metric-label">AI Confidence</div>
        </div>
        <div class="metric-card">
            <div class="metric-value quality">${reportData.aiAnalysis.qualityScore}%</div>
            <div class="metric-label">Quality Score</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">$${reportData.revenueAnalysis.revenueIncrease}</div>
            <div class="metric-label">Revenue Increase</div>
        </div>
        <div class="metric-card">
            <div class="metric-value processing">${reportData.aiAnalysis.processingTime}s</div>
            <div class="metric-label">Processing Time</div>
        </div>
    </div>

    <div class="section-title">REVENUE IMPACT ANALYSIS</div>
    <table>
        <thead>
            <tr>
                <th>Metric</th>
                <th>Initial Data</th>
                <th>Dx Confirmation</th>
                <th>Updated M Items</th>
                <th>Optimized Results</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Admission Source</td>
                <td>${reportData.revenueAnalysis.initial.admissionSource || 'N/A'}</td>
                <td>--</td>
                <td>--</td>
                <td>${reportData.revenueAnalysis.optimized.admissionSource || 'N/A'}</td>
            </tr>
            <tr>
                <td>Episode Timing</td>
                <td>${reportData.revenueAnalysis.initial.episodeTiming || 'N/A'}</td>
                <td>--</td>
                <td>--</td>
                <td>${reportData.revenueAnalysis.optimized.episodeTiming || 'N/A'}</td>
            </tr>
            <tr>
                <td>Clinical Group</td>
                <td>${reportData.revenueAnalysis.initial.clinicalGroup || 'N/A'}</td>
                <td>--</td>
                <td>--</td>
                <td>${reportData.revenueAnalysis.optimized.clinicalGroup || 'N/A'}</td>
            </tr>
            <tr>
                <td>Comorbidity Adj.</td>
                <td>${reportData.revenueAnalysis.initial.comorbidityAdj || 'N/A'}</td>
                <td>--</td>
                <td>--</td>
                <td>${reportData.revenueAnalysis.optimized.comorbidityAdj || 'N/A'}</td>
            </tr>
            <tr class="highlight-row">
                <td><strong>Functional Score</strong></td>
                <td><strong>${reportData.revenueAnalysis.initial.functionalScore || 'N/A'}</strong></td>
                <td>--</td>
                <td>→</td>
                <td><strong>${reportData.revenueAnalysis.optimized.functionalScore || 'N/A'}</strong></td>
            </tr>
            <tr class="highlight-row">
                <td><strong>Functional Level</strong></td>
                <td>${reportData.revenueAnalysis.initial.functionalLevel || 'N/A'}</td>
                <td>--</td>
                <td>→</td>
                <td>${reportData.revenueAnalysis.optimized.functionalLevel || 'N/A'}</td>
            </tr>
            <tr>
                <td><strong>HIPPS Code</strong></td>
                <td>${reportData.revenueAnalysis.initial.hippsCode || 'N/A'}</td>
                <td>--</td>
                <td>→</td>
                <td><strong>${reportData.revenueAnalysis.optimized.hippsCode || 'N/A'}</strong></td>
            </tr>
            <tr>
                <td>Case Mix Weight</td>
                <td>${reportData.revenueAnalysis.initial.caseMixWeight || 'N/A'}</td>
                <td>--</td>
                <td>--</td>
                <td><strong>${reportData.revenueAnalysis.optimized.caseMixWeight || 'N/A'}</strong></td>
            </tr>
            <tr>
                <td>Weighted Rate</td>
                <td>$${reportData.revenueAnalysis.initial.weightedRate?.toLocaleString() || 'N/A'}</td>
                <td>--</td>
                <td>--</td>
                <td><strong>$${reportData.revenueAnalysis.optimized.weightedRate?.toLocaleString() || 'N/A'}</strong></td>
            </tr>
            <tr>
                <td><strong>30 day Period Revenue</strong></td>
                <td><strong>$${reportData.revenueAnalysis.initial.revenue?.toLocaleString() || 'N/A'}</strong></td>
                <td>--</td>
                <td>--</td>
                <td><strong>$${reportData.revenueAnalysis.optimized.revenue?.toLocaleString() || 'N/A'}</strong></td>
            </tr>
            <tr class="revenue-row">
                <td><strong>Revenue Increase</strong></td>
                <td>--</td>
                <td>--</td>
                <td>--</td>
                <td><strong>$${reportData.revenueAnalysis.revenueIncrease}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="page-break"></div>

    <div class="section-title">ACTIVE DIAGNOSES</div>
    
    <h4>M1021 - Primary Diagnosis</h4>
    <table>
        <thead>
            <tr>
                <th>ICD 10 Code</th>
                <th>Description</th>
                <th>Clinical Group</th>
                <th>Comorbidity Group</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>${reportData.diagnoses?.primary?.code || 'N/A'}</strong></td>
                <td>${reportData.diagnoses?.primary?.description || 'N/A'}</td>
                <td>${reportData.diagnoses?.primary?.clinicalGroup || 'N/A'}</td>
                <td>${reportData.diagnoses?.primary?.comorbidityGroup || 'N/A'}</td>
            </tr>
        </tbody>
    </table>

    <h4>M1023 - Other Diagnoses</h4>
    <table>
        <thead>
            <tr>
                <th>ICD 10 Code</th>
                <th>Description</th>
                <th>Clinical Group</th>
                <th>Comorbidity Group</th>
            </tr>
        </thead>
        <tbody>
            ${(reportData.diagnoses?.secondary || [])
              .map(
                (diagnosis: any) => `
                <tr>
                    <td><strong>${diagnosis.code || 'N/A'}</strong></td>
                    <td>${diagnosis.description || 'N/A'}</td>
                    <td>${diagnosis.clinicalGroup || 'N/A'}</td>
                    <td>${diagnosis.comorbidityGroup || 'N/A'}</td>
                </tr>
            `
              )
              .join("")}
        </tbody>
    </table>

    <div class="page-break"></div>

    <div class="section-title">REQUIRED CORRECTIONS & SUGGESTIONS</div>
    <div style="margin-bottom: 20px; padding: 15px; background: #dbeafe; border-radius: 8px;">
        <strong>AI Confidence: ${reportData.aiAnalysis.confidence}%</strong> - The following corrections are recommended based on clinical documentation analysis. Each correction has been validated against Medicare guidelines and will optimize reimbursement.
    </div>

    ${(reportData.aiAnalysis?.corrections || [])
      .map(
        (correction: any) => `
        <div class="correction-item">
            <div class="correction-header">
                <span>${correction.section || 'N/A'}</span>
                <span class="severity-badge severity-${correction.severity || 'medium'}">${(correction.severity || 'medium').toUpperCase()}</span>
            </div>
            <div style="margin-bottom: 15px; color: #374151;">${correction.issue || 'N/A'}</div>
            
            <div class="correction-grid">
                <div class="current-value">
                    <strong>Current Value:</strong><br>
                    ${correction.currentValue || 'N/A'}
                </div>
                <div class="suggested-value">
                    <strong>Suggested Value:</strong><br>
                    ${correction.suggestedValue || 'N/A'}
                </div>
            </div>
            
            <div class="rationale">
                <strong>Rationale:</strong><br>
                ${correction.rationale || 'N/A'}
            </div>
            
            <div class="impact">
                <strong>Financial Impact:</strong><br>
                ${correction.impact || 'N/A'}
            </div>
        </div>
    `
      )
      .join("")}

    <div class="section-title">AI RECOMMENDATIONS</div>
    <ul>
        ${(reportData.aiAnalysis?.recommendations || []).map((rec: string) => `<li>${rec}</li>`).join("")}
    </ul>

    <div class="section-title">CODING DOCUMENTATION REQUEST</div>
    <div style="margin-bottom: 15px;">
        <strong>Issue Subtype:</strong> ${reportData.codingRequest?.issueSubtype || 'N/A'}<br>
        <strong>Status:</strong> ${reportData.codingRequest?.status || 'N/A'}
    </div>
    
    <div style="margin-bottom: 15px; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <strong>Issue Details:</strong><br>
        ${reportData.codingRequest?.details || 'N/A'}
    </div>
    
    <div style="margin-bottom: 15px; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <strong>Client Response:</strong><br>
        ${reportData.codingRequest?.clientResponse || 'N/A'}
    </div>
    
    <div style="margin-bottom: 15px; padding: 15px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px;">
        <strong>Outcome:</strong><br>
        ${reportData.codingRequest?.outcome || 'N/A'}
    </div>

    <div class="footer">
        <p><strong>MASE AI</strong> has reviewed the OASIS based upon current coding guidelines. The agency is responsible for ensuring that the visit is billable and meets State and Federal Guidelines.</p>
        <p>MASE AI has coded these diagnoses based upon OASIS and H&P information provided. Any diagnosis or comorbidities suggested within the Medication Profile, or other documents are not included if they are not documented in the OASIS.</p>
        <p>MASE AI will not be held responsible for any inconsistencies within the Face to Face encounter form if this form was not included when the assessment was reviewed and coded.</p>
        <p style="text-align: center; margin-top: 20px;">Report generated on ${new Date().toLocaleString()} | AI Confidence: ${reportData.aiAnalysis.confidence}%</p>
    </div>
</body>
</html>`

    // Return the HTML content with proper headers for PDF generation
    console.log(`✅ Successfully generated PDF export for ${reportData.patientInfo.name}`)
    
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="OASIS_Optimization_Report_${reportData.patientInfo.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("❌ PDF export error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF export",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generatePDFContent(reportData: any): string {
  // This function could be expanded to generate more sophisticated PDF content
  // For now, it returns a summary that could be used with PDF generation libraries
  return `
OASIS Optimization Report Summary
Patient: ${reportData.patientInfo.name}
AI Confidence: ${reportData.aiAnalysis.confidence}%
Revenue Increase: $${reportData.revenueAnalysis.revenueIncrease}
Corrections: ${reportData.aiAnalysis.corrections.length} items identified
Generated: ${new Date().toLocaleString()}
`
}
