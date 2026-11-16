import Card from "@/components/ui/Card";
import { FIT_ENABLED } from "@/lib/features";

export default function HowToRead() {
  return (
    <Card eyebrow="How to read this">
      <dl className="space-y-2 text-[11px] leading-relaxed text-ink-500">
        <div>
          <dt className="inline font-semibold text-teal-900">Momentum</dt>{" "}
          <dd className="inline">
            shows how strongly a trend is performing right now: engagement per post compared with the
            other trends, how fast posting is growing, and how recent the posts are.
          </dd>
        </div>
        {FIT_ENABLED ? (
          <div>
            <dt className="inline font-semibold text-teal-900">Fit</dt>{" "}
            <dd className="inline">
              shows how naturally the trend belongs to the selected audience and your business.
            </dd>
          </div>
        ) : (
          <div>
            <dt className="inline font-semibold text-teal-900">Weekly growth</dt>{" "}
            <dd className="inline">
              compares the number of posts in the last 7 days with the 7 days before. Above the line
              means growing, below means slowing.
            </dd>
          </div>
        )}
        <div>
          <dt className="inline font-semibold text-teal-900">Advice</dt>{" "}
          <dd className="inline">
            {FIT_ENABLED
              ? "combines momentum and fit: Act now, Use with care, Watch or Skip."
              : "is based on momentum for now: Act now (75+), Use with care (60+), Watch (40+), otherwise Skip."}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
