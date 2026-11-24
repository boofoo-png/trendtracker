"use client";

// Competitors page: real competitors on Instagram (see RealCompetitors). The sample
// "campaign insights" cards from the Figma Make app were removed once real data existed.

import { PageTitle } from "@/components/ui/Dashboard";
import RealCompetitors from "./RealCompetitors";

export default function CompetitorsDashboard() {
  return (
    <div className="w-full">
      <PageTitle
        eyebrow="Competitive intelligence"
        title="Competitor performance"
        description="Track real competitors on Instagram and see how your business compares."
      />
      <RealCompetitors />
    </div>
  );
}
