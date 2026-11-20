import AppShell from "@/components/shell/AppShell";
import NotFoundPage from "@/components/shell/NotFoundPage";

export const metadata = {
  title: "Page not found · SixthSense",
};

// Shown for any URL that doesn't match a page (and when a page calls notFound()).
export default function NotFound() {
  return (
    <AppShell>
      <NotFoundPage />
    </AppShell>
  );
}
