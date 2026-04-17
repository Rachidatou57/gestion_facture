import InvoiceForm from "@/components/InvoiceForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Nouvelle Facture</h1>
        <InvoiceForm />
      </div>
    </main>
  );
}
