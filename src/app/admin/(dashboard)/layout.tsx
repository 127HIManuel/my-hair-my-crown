import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl">
      <Sidebar />
      <div className="min-h-[70vh] flex-1 px-8 py-8">{children}</div>
    </div>
  );
}
