import Sidebar from "@/components/shell/Sidebar";
import TopBar from "@/components/shell/TopBar";
import ContentTrendWatcher from "@/components/shell/ContentTrendWatcher";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <ContentTrendWatcher />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-[1240px] px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
