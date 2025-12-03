import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export interface TemplateField {
  name: string
  type: "text" | "textarea" | "date" | "signature" | "checkbox"
  required: boolean
  placeholder?: string
}

export interface DocumentTemplate {
  id: string
  templateId: string
  name: string
  description: string
  category: string
  fields: TemplateField[]
  content?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// GET - Fetch all templates
export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      // If table doesn't exist, return default templates
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          data: getDefaultTemplates(),
          message: "Using default templates. Run setup-document-templates-table.sql to enable database storage.",
        })
      }
      throw error
    }

    const templates: DocumentTemplate[] = (data || []).map((t: any) => ({
      id: t.id,
      templateId: t.template_id,
      name: t.name,
      description: t.description || "",
      category: t.category || "General",
      fields: t.fields || [],
      content: t.content,
      isActive: t.is_active,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))

    return NextResponse.json({
      success: true,
      data: templates.length > 0 ? templates : getDefaultTemplates(),
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({
      success: true,
      data: getDefaultTemplates(),
    })
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { name, description, category, fields } = body

    if (!name) {
      return NextResponse.json({ success: false, error: "Template name is required" }, { status: 400 })
    }

    const templateId = `TEMP-${Date.now()}`

    const { data, error } = await supabase
      .from("document_templates")
      .insert({
        template_id: templateId,
        name,
        description: description || "",
        category: category || "General",
        fields: fields || [],
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating template:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        templateId: data.template_id,
        name: data.name,
        description: data.description,
        category: data.category,
        fields: data.fields,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create template" },
      { status: 500 },
    )
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, name, description, category, fields, isActive } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (fields !== undefined) updateData.fields = fields
    if (isActive !== undefined) updateData.is_active = isActive

    const { data, error } = await supabase
      .from("document_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating template:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        templateId: data.template_id,
        name: data.name,
        description: data.description,
        category: data.category,
        fields: data.fields,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update template" },
      { status: 500 },
    )
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("document_templates").delete().eq("id", id)

    if (error) {
      console.error("Error deleting template:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete template" },
      { status: 500 },
    )
  }
}

// Default templates fallback
function getDefaultTemplates(): DocumentTemplate[] {
  return [
    {
      id: "default-1",
      templateId: "TEMP-001",
      name: "Employment Agreement",
      description: "Standard employment contract template",
      category: "HR",
      fields: [
        { name: "Employee Name", type: "text", required: true },
        { name: "Position", type: "text", required: true },
        { name: "Start Date", type: "date", required: true },
        { name: "Employee Signature", type: "signature", required: true },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "default-2",
      templateId: "TEMP-002",
      name: "Confidentiality Agreement",
      description: "Non-disclosure agreement template",
      category: "Legal",
      fields: [
        { name: "Employee Name", type: "text", required: true },
        { name: "Department", type: "text", required: true },
        { name: "Effective Date", type: "date", required: true },
        { name: "Employee Signature", type: "signature", required: true },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "default-3",
      templateId: "TEMP-003",
      name: "Healthcare Order",
      description: "Physician signature for healthcare orders",
      category: "Healthcare",
      fields: [
        { name: "Patient Name", type: "text", required: true },
        { name: "Order Type", type: "text", required: true },
        { name: "Order Date", type: "date", required: true },
        { name: "Physician Signature", type: "signature", required: true },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "default-4",
      templateId: "TEMP-004",
      name: "HIPAA Agreement",
      description: "HIPAA privacy and security agreement",
      category: "Compliance",
      fields: [
        { name: "Employee Name", type: "text", required: true },
        { name: "Position", type: "text", required: true },
        { name: "Training Date", type: "date", required: true },
        { name: "Employee Signature", type: "signature", required: true },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}
