import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Create an account · SixthSense",
};

export default function SignupPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-5 min-[621px]:p-[clamp(28px,6vw,72px)]">
      <SignupForm />
    </main>
  );
}
