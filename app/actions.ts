'use server'

import prisma from "@/lib/prisma"
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

export async function createInvoiceAction(formData: any) {
  // 1. Validation
  const validatedData = invoiceSchema.parse(formData)

  // 2. Calculs
  const subtotal = validatedData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0)
  const tax = subtotal * 0.20
  const total = subtotal + tax

  // 3. Sauvegarde BDD (Simulé ici, il faudrait récupérer l'user connecté)
  const newInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: validatedData.invoiceNumber,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
      clientName: validatedData.clientName,
      clientEmail: validatedData.clientEmail,
      clientAddress: "123 Rue Test", // A récupérer du form
      subtotal, tax, total,
      userId: "clg8x...", // ID de l'utilisateur connecté (à récupérer via session)
      items: {
        create: validatedData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        }))
      }
    }
  })

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