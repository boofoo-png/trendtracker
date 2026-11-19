import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ContentTrendWatcher from "./ContentTrendWatcher";

/** Sidebar + top bar around a page. Used by the dashboard layout and the 404 page. */
export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen">
      <ContentTrendWatcher />
      <Sidebar />
      {/* The top bar and the page share one column, so their edges always line up. */}
      <div className="mx-auto flex w-full max-w-[1240px] min-w-0 flex-1 flex-col px-4 sm:px-6">
        <TopBar />
        <main className="w-full py-8">{children}</main>
      </div>
    </div>
  );
}
