import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, TableRow, TableCell, Table, WidthType,
} from "docx";
import { getSupabaseAdmin } from "@/lib/supabase";

interface OnboardingData {
  clientName: string; businessName: string; email: string; phone: string;
  address: string; industry: string; services: string[];
  projectDescription: string; currentTools: string; monthlyBudget: string;
  timeline: string; goals: string; specialRequirements: string;
}

function createInfoRow(label: string, value: string): TableRow {
  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  };
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22, font: "Calibri" })], spacing: { before: 60, after: 60 } })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        children: [new Paragraph({ children: [new TextRun({ text: value || "N/A", size: 22, font: "Calibri" })], spacing: { before: 60, after: 60 } })],
      }),
    ],
  });
}

function generateContract(data: OnboardingData): Document {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "JONTRI", bold: true, size: 36, font: "Calibri", color: "0077CC" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "AI Automation Consulting", size: 24, font: "Calibri", color: "666666" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "www.jontri.com  |  hello@jontri.com", size: 20, font: "Calibri", color: "999999" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: "SERVICE AGREEMENT", bold: true, size: 32, font: "Calibri" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Date: ${today}`, size: 22, font: "Calibri", color: "666666" })] }),

        // 1. Parties
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "1. PARTIES", bold: true, size: 26, font: "Calibri", color: "0077CC" })] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "This Service Agreement (\"Agreement\") is entered into as of ", size: 22, font: "Calibri" }), new TextRun({ text: today, bold: true, size: 22, font: "Calibri" }), new TextRun({ text: " by and between:", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Service Provider: ", bold: true, size: 22, font: "Calibri" }), new TextRun({ text: "Jontri AI Automation Consulting (\"Jontri\")", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: "Client: ", bold: true, size: 22, font: "Calibri" }), new TextRun({ text: `${data.clientName}, ${data.businessName} ("Client")`, size: 22, font: "Calibri" })] }),

        // 2. Client Info
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "2. CLIENT INFORMATION", bold: true, size: 26, font: "Calibri", color: "0077CC" })] }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [createInfoRow("Full Name", data.clientName), createInfoRow("Business Name", data.businessName), createInfoRow("Email", data.email), createInfoRow("Phone", data.phone), createInfoRow("Address", data.address), createInfoRow("Industry", data.industry)] }),

        // 3. Scope
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: "3. SCOPE OF SERVICES", bold: true, size: 26, font: "Calibri", color: "0077CC" })] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Jontri agrees to provide the following AI automation services to the Client:", size: 22, font: "Calibri" })] }),
        ...data.services.map((service) => new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, children: [new TextRun({ text: `•  ${service}`, size: 22, font: "Calibri" })] })),
        new Paragraph({ spacing: { before: 300, after: 100 }, children: [new TextRun({ text: "Project Description:", bold: true, size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: data.projectDescription, size: 22, font: "Calibri" })] }),
        ...(data.currentTools ? [new Paragraph({ spacing: { before: 100, after: 100 }, children: [new TextRun({ text: "Current Tools/Software: ", bold: true, size: 22, font: "Calibri" }), new TextRun({ text: data.currentTools, size: 22, font: "Calibri" })] })] : []),

        // 4. Project Details
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: "4. PROJECT DETAILS", bold: true, size: 26, font: "Calibri", color: "0077CC" })] }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [createInfoRow("Monthly Budget", data.monthlyBudget || "To be discussed"), createInfoRow("Timeline", data.timeline || "To be discussed"), createInfoRow("Success Goals", data.goals || "To be discussed"), ...(data.specialRequirements ? [createInfoRow("Special Requirements", data.specialRequirements)] : [])] }),

        // 5. Terms
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: "5. TERMS & CONDITIONS", bold: true, size: 26, font: "Calibri", color: "0077CC" })] }),
        new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "5.1 ", bold: true, size: 22, font: "Calibri" }), new TextRun({ text: "This Agreement shall commence on the date stated above and continue for an initial period aligned with the agreed-upon timeline, unless terminated earlier by either party with 30 days written notice.", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "5.2 ", bold: true, size: 22, font: "Calibri" }), new TextRun({ text: "Payment terms will be net 15 from invoice date. A detailed payment schedule will be provided upon project kickoff.", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "5.3 ", bold: true, size: 22, font: "Calibri" }), new TextRun({ text: "All intellectual property developed during this engagement shall be owned by the Client upon full payment, except for Jontri pre-existing tools and frameworks.", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "5.4 ", bold: true, size: 22, font: "Calibri" }), new TextRun({ text: "Both parties agree to maintain confidentiality of all proprietary information shared during this engagement.", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "5.5 ", bold: true, size: 22, font: "Calibri" }), new TextRun({ text: "Jontri shall not be liable for any indirect, incidental, or consequential damages. Total liability shall not exceed the total fees paid under this Agreement.", size: 22, font: "Calibri" })] }),

        // 6. Signatures
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 300 }, children: [new TextRun({ text: "6. SIGNATURES", bold: true, size: 26, font: "Calibri", color: "0077CC" })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "By signing below, both parties agree to the terms outlined in this Agreement.", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: "SERVICE PROVIDER — Jontri AI Automation Consulting", bold: true, size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: "________________________________________", size: 22, font: "Calibri" })] }),
        new Paragraph({ children: [new TextRun({ text: "Signature                                              Date", size: 20, font: "Calibri", color: "666666" })] }),
        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "________________________________________", size: 22, font: "Calibri" })] }),
        new Paragraph({ children: [new TextRun({ text: "Printed Name                                        Title", size: 20, font: "Calibri", color: "666666" })] }),
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: `CLIENT — ${data.businessName}`, bold: true, size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: "________________________________________", size: 22, font: "Calibri" })] }),
        new Paragraph({ children: [new TextRun({ text: "Signature                                              Date", size: 20, font: "Calibri", color: "666666" })] }),
        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "________________________________________", size: 22, font: "Calibri" })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `Printed Name: ${data.clientName}`, size: 20, font: "Calibri", color: "666666" }), new TextRun({ text: "                    Title: _______________", size: 20, font: "Calibri", color: "666666" })] }),
      ],
    }],
  });
}

export async function POST(request: NextRequest) {
  try {
    const data: OnboardingData = await request.json();
    if (!data.clientName || !data.businessName || !data.email || !data.phone || !data.industry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!data.services || data.services.length === 0) {
      return NextResponse.json({ error: "At least one service must be selected" }, { status: 400 });
    }
    // Map onboarding service names → platform service keys
    const SERVICE_MAP: Record<string, string> = {
      "AI Chatbot / Virtual Assistant": "chatbot",
      "AI Voice Agent": "voice-agent",
      "Automated Lead Capture & Nurture": "prospector",
      "Smart Scheduling & Dispatch": "voice-agent",
      "Review & Reputation Management": "review-mgmt",
      "Workflow & Back-Office Automation": "prospector",
      "Social Media Automation": "seo-audit",
      "Custom AI Solution": "chatbot",
    };

    // Auto-create client in Supabase
    try {
      const supabase = getSupabaseAdmin();
      const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const now = new Date().toISOString();

      // Map selected services to platform keys (deduplicated)
      const platformServices = [...new Set(data.services.map((s) => SERVICE_MAP[s] || s))];

      const { data: existing } = await supabase
        .from("clients")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!existing) {
        await supabase.from("clients").insert({
          slug,
          name: data.businessName,
          industry: data.industry,
          description: data.projectDescription || "",
          contact_name: data.clientName,
          contact_email: data.email,
          contact_phone: data.phone,
          services: Object.fromEntries(
            platformServices.map((s) => [s, { status: "pending", updated_at: now }])
          ),
          status: "active",
        });
      } else {
        // Client exists — merge any new services
        const existingServices = existing.services || {};
        for (const svc of platformServices) {
          if (!existingServices[svc]) {
            existingServices[svc] = { status: "pending", updated_at: now };
          }
        }
        await supabase
          .from("clients")
          .update({ services: existingServices })
          .eq("slug", slug);
      }

      // Upsert client config
      const { data: existingConfig } = await supabase
        .from("client_configs")
        .select("config")
        .eq("slug", slug)
        .single();

      const prevConfig = existingConfig?.config || {};
      const config = {
        ...prevConfig,
        client: { name: data.businessName, industry: data.industry, description: data.projectDescription || "", website: prevConfig?.client?.website || "" },
        sender: prevConfig.sender || {
          from_name: "Vincent Kalman",
          from_title: "Founder",
          from_company: "Jontri Consulting",
          booking_url: "https://calendly.com/jontri/consultation",
        },
        onboarding: {
          services_requested: data.services,
          project_description: data.projectDescription || "",
          current_tools: data.currentTools || "",
          monthly_budget: data.monthlyBudget || "",
          timeline: data.timeline || "",
          goals: data.goals || "",
          special_requirements: data.specialRequirements || "",
          submitted_at: now,
        },
      };

      await supabase
        .from("client_configs")
        .upsert({ slug, config, updated_at: now });
    } catch {
      // Don't block contract generation if DB write fails
    }

    const doc = generateContract(data);
    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Jontri_Contract_${data.businessName.replace(/\s+/g, "_")}.docx"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate contract" }, { status: 500 });
  }
}