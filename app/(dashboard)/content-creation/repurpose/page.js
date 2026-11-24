import { redirect } from "next/navigation";

// "Adapt for other platforms" now opens in place (under a result, or as a pop-up in
// My Content), so the old page sends people to My Content.
export default function Page() {
  redirect("/content-creation/my-content");
}
