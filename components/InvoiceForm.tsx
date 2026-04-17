'use client'

import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"
import { createInvoiceAction } from "@/app/actions" // On va créer ça juste après

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Numéro requis"),
  clientName: z.string().min(1, "Nom requis"),
  clientEmail: z.string().email(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    price: z.number().min(0),
  }))
}) as any

type FormData = z.infer<typeof invoiceSchema>

export default function InvoiceForm() {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { items: [{ description: "", quantity: 1, price: 0 }] }
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })
  const items = watch("items")
  
  // Calcul automatique des totaux
  const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.price), 0)
  const tax = subtotal * 0.20 // 20% TVA
  const total = subtotal + tax

  const onSubmit = async (data: FormData) => {
    // Appel de la Server Action
    await createInvoiceAction(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-100 space-y-6">
      
      {/* Info Client */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">Client Name</label>
          <input {...register("clientName")} className="w-full border border-gray-200 rounded p-2 text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">Invoice #</label>
          <input {...register("invoiceNumber")} className="w-full border border-gray-200 rounded p-2 text-sm" />
        </div>
      </div>

      {/* Articles Dynamiques */}
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-gray-500">Items</h3>
          <button type="button" onClick={() => append({ description: "", quantity: 1, price: 0 })} 
                  className="text-orange-500 text-sm flex items-center gap-1 hover:underline">
            <Plus size={14} /> Add Item
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-center border-b pb-2">
            <div className="col-span-5">
              <input {...register(`items.${index}.description`)} placeholder="Description" className="w-full border-none focus:ring-0 text-sm" />
            </div>
            <div className="col-span-2">
              <input {...register(`items.${index}.quantity`)} type="number" className="w-full border-none focus:ring-0 text-sm text-right" />
            </div>
            <div className="col-span-2">
              <input {...register(`items.${index}.price`)} type="number" className="w-full border-none focus:ring-0 text-sm text-right" />
            </div>
            <div className="col-span-2 text-right text-sm font-medium">
              ${(items[index]?.quantity * items[index]?.price || 0).toFixed(2)}
            </div>
            <div className="col-span-1 text-right">
              <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé */}
      <div className="flex justify-end pt-4 border-t">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span> <span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Tax (20%)</span> <span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg text-orange-500 pt-2 border-t mt-2">
            <span>Total</span> <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button type="submit" className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition">
         Save & Send Invoice
      </button>
    </form>
  )
}