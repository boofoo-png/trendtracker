import Icon from "@/components/ui/Icon";
import { AuthBrand, Eyebrow, glass } from "./ui";

/** Page + card layout of the Figma Make app's ForgotPasswordPage (.recovery-page). */
export default function RecoveryCard({ icon, eyebrow, title, description, children, action }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_78%_28%,rgba(221,254,86,0.7),transparent_31%),linear-gradient(104deg,#547f52,#03525e_52%,#b8d958)] px-[22px] py-[38px]">
      <div className="w-full max-w-[560px]">
        <AuthBrand />
        <form action={action} className={`flex flex-col gap-[15px] rounded-[18px] p-[clamp(25px,5vw,42px)] text-paper ${glass}`}>
          <span className="grid size-[54px] place-items-center rounded-[15px] bg-sense-lime text-sense-navy">
            <Icon name={icon} size={24} />
          </span>
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="text-[clamp(27px,4vw,38px)] leading-[1.15] tracking-[-0.025em]">{title}</h1>
          </div>
          <p className="mb-[7px] text-sm leading-[1.6]">{description}</p>
          {children}
        </form>
      </div>
    </main>
  );
}
