import { redirect } from "next/navigation";

// Merged into "Improve a post, ad or document"; old links and bookmarks land there.
export default function Page() {
  redirect("/content-creation/improve");
}
