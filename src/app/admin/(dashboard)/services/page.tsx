import { createClient } from "@/lib/supabase/server";
import ServiceManager from "@/components/admin/ServiceManager";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const supabase = createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("category_sort")
    .order("sort_order");

  return (
    <div>
      <p className="text-xs uppercase tracking-widest2 text-wine-500">Menu</p>
      <h1 className="mb-8 font-display text-3xl">Services</h1>
      <ServiceManager initialServices={services ?? []} />
    </div>
  );
}
