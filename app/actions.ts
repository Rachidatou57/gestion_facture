'use server'

import { supabaseAdmin } from "@/lib/supabaseClient"
import { Resend } from "resend"
import { z } from "zod"

const resend = new Resend(process.env.RESEND_API_KEY)

// Schéma pour valider les données entrantes
const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  clientName: z.string(),
  clientEmail: z.string(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    price: z.number(),
  }))
})

type InvoiceInput = z.infer<typeof invoiceSchema>

export async function createInvoiceAction(formData: unknown) {
  // 1. Validation
  const validatedData: InvoiceInput = invoiceSchema.parse(formData)

  // 2. Calculs
  const subtotal = validatedData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0)
  const tax = subtotal * 0.20
  const total = subtotal + tax

  // 3. Sauvegarde BDD (Simulé ici, il faudrait récupérer l'user connecté)
  const invoicePayload = {
    invoice_number: validatedData.invoiceNumber,
    date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 jours
    client_name: validatedData.clientName,
    client_email: validatedData.clientEmail,
    client_address: "123 Rue Test", // A récupérer du form
    subtotal,
    tax,
    total,
    user_id: "clg8x...", // ID de l'utilisateur connecté (à récupérer via session)
  }

  const { data: newInvoice, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .insert(invoicePayload)
    .select("id")
    .single()

  if (invoiceError || !newInvoice) {
    throw new Error(invoiceError?.message ?? "Invoice creation failed")
  }

  const itemsPayload = validatedData.items.map((item) => ({
    invoice_id: newInvoice.id,
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    total: item.quantity * item.price,
  }))

  const { error: itemsError } = await supabaseAdmin
    .from("invoice_items")
    .insert(itemsPayload)

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  // 4. Envoi Email (Simulé)
  try {
    await resend.emails.send({
      from: 'factures@tonapp.com',
      to: validatedData.clientEmail,
      subject: `Facture ${validatedData.invoiceNumber}`,
      // Ici tu mettrais ton template React Email
      html: `<h1>Merci pour votre commande !</h1><p>Votre facture est prête.</p>`
    })
    console.log("Email envoyé !")
  } catch (error) {
    console.error("Erreur email", error)
  }

  return { success: true, invoiceId: newInvoice.id }
}