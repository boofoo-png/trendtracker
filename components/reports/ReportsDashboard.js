"use client";

// Insights / Reports, laid out like the Marketing Intelligence Hub Figma Make app.
// Figures are sample data (lib/sample) for the chosen date range until ad and analytics
// accounts are connected.

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { PageTitle, Panel, SampleNote } from "@/components/ui/Dashboard";
import PeriodPicker from "@/components/ui/PeriodPicker";
import { SkeletonPanel } from "@/components/ui/Skeleton";
import { rangeLabel, resolvePeriod } from "@/lib/periods";
import { reportFor } from "@/lib/sample/reports";
import { useToday } from "@/lib/calendar";
import usePeriod from "@/lib/usePeriod";
import RevenueChart from "./RevenueChart";

const METRICS = ["Revenue", "Conversions"];
const SORTS = ["Top countries", "Lowest countries"];

const isNegative = (change) => change.startsWith("-");
const money = (n) => `$${n.toLocaleString("en-US")}`;

function Kpi({ label, value, change, compareTo, icon }) {
  return (
    <article className="flex min-h-[123px] min-w-0 flex-col items-start rounded-[20px] border border-paper/75 bg-paper/95 p-3.5 text-sense-navy shadow-[0_5px_0_rgba(0,31,62,0.16),0_16px_28px_rgba(0,31,62,0.09)]">
      <div className="flex w-full items-center justify-between text-sense-blue">
        <span className="text-[11px] font-bold">{label}</span>
        <Icon name={icon} size={14} className={icon === "chevron" ? "-rotate-45" : ""} />
      </div>
      <strong className="mt-3.5 text-[clamp(19px,2vw,26px)] leading-none font-medium tracking-[-0.04em] text-[#10292f]">
        {value}
      </strong>
      <small className={`mt-[7px] text-[10px] font-semibold ${isNegative(change) ? "text-[#b84f4f]" : "text-[#4e8665]"}`}>
        {change}
      </small>
      <p className="mt-auto text-[10px] leading-[1.4] text-[#6a787a]">vs the {compareTo}</p>
    </article>
  );
}

function InsightsPanel({ data, chartKey }) {
  const [full, setFull] = useState(false);
  return (
    <Panel className="xl:col-span-7">
      <div className="flex items-center gap-2">
        <span className="grid size-[30px] place-items-center rounded-[9px] bg-sense-lime text-sense-navy">
          <Icon name="sparkles" size={16} />
        </span>
        <h3 className="text-[15px] font-bold text-sense-blue">AI Insights Summary</h3>
      </div>
      <div className="mt-2.5 grid gap-[17px] md:grid-cols-[minmax(250px,1.15fr)_minmax(190px,0.85fr)]">
        <RevenueChart key={chartKey} revenue={data.revenue} />
        <div className="flex flex-col">
          <h4 className="text-xs font-bold text-sense-blue">Insights</h4>
          <p className="mt-[7px] text-[11px] leading-[1.6] text-[#536669]">{data.insight}</p>
          <ul className="mt-2 grid gap-1 text-[11px] text-[#536669]">
            <li><strong className="text-sense-blue">Top performer:</strong> {data.topPerformer}</li>
            <li><strong className="text-sense-blue">Underperforming:</strong> {data.underperforming}</li>
          </ul>
          {full && (
            <p className="mt-2 text-[11px] leading-[1.6] text-[#536669]">
              <strong className="text-sense-blue">AI suggestion:</strong> {data.suggestion}
            </p>
          )}
          <button
            type="button"
            aria-expanded={full}
            onClick={() => setFull((v) => !v)}
            className="mt-auto self-start rounded-[16px] bg-sense-blue px-3.5 py-2 text-[11px] font-bold text-paper transition hover:bg-sense-blue/85 max-md:mt-3"
          >
            {full ? "Show less" : "View full insight"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

/** Small pill that cycles through its options on click. */
function CycleButton({ options, value, onChange, label }) {
  const next = options[(options.indexOf(value) + 1) % options.length];
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      title={`${label}: switch to ${next}`}
      className="inline-flex items-center gap-1 rounded-[14px] border border-sense-blue/15 bg-white/70 px-2.5 py-1.5 text-[10px] font-bold text-sense-blue transition hover:bg-sense-lime"
    >
      {value} <Icon name="repeat" size={12} />
    </button>
  );
}

function CountryPanel({ data, days }) {
  const [metric, setMetric] = useState(METRICS[0]);
  const [sort, setSort] = useState(SORTS[0]);
  const rows = [...data.countries].sort((a, b) =>
    sort === SORTS[0] ? b[metric] - a[metric] : a[metric] - b[metric],
  );
  const max = Math.max(...data.countries.map((c) => c[metric]));
  const total = data.countries.reduce((sum, c) => sum + c[metric], 0);
  const show = (n) => (metric === "Revenue" ? money(n) : n.toLocaleString("en-US"));

  return (
    <Panel className="xl:col-span-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-[15px] font-bold text-sense-blue">Performance by Country</h3>
        <div className="flex gap-2">
          <CycleButton label="Metric" options={METRICS} value={metric} onChange={setMetric} />
          <CycleButton label="Sort" options={SORTS} value={sort} onChange={setSort} />
        </div>
      </div>
      <div className="mt-4 grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
        <dl className="grid content-start gap-1 text-[10px] text-[#647477]">
          <dt>{sort === SORTS[0] ? "Top performing" : "Lowest performing"}</dt>
          <dd className="mb-2 text-xl font-medium text-sense-navy">{show(rows[0][metric])}</dd>
          <dt>Total across countries</dt>
          <dd className="mb-2 text-xl font-medium text-sense-navy">{show(total)}</dd>
          <dt>Period</dt>
          <dd className="text-xl font-medium text-sense-navy">{days} days</dd>
        </dl>
        <ul className="grid content-start gap-3">
          {rows.map((c) => (
            <li key={c.name} className="grid gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-sense-blue">{c.name}</span>
                <span className="text-sense-navy">{show(c[metric])}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#dce5d1]">
                <div
                  className="h-full rounded-full bg-sense-blue transition-[width] duration-300"
                  style={{ width: `${(c[metric] / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function CampaignPanel({ data }) {
  const { campaign, score } = data;
  return (
    <Panel className="xl:col-span-5">
      <h3 className="text-[15px] font-bold text-sense-blue">Top Campaigns</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div aria-hidden="true" className="flex h-[120px] items-end gap-2">
          {campaign.bars.map((h, i) => (
            <i
              key={i}
              className={`flex-1 rounded-t-[5px] rounded-b-[2px] transition-[height] duration-300 ${i === 1 ? "bg-sense-lime" : "bg-sense-blue"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <dl className="grid content-start gap-1.5 text-[11px] text-[#647477]">
          {[
            ["Campaign", campaign.name],
            ["Spend", campaign.spend],
            ["Revenue", campaign.revenue],
            ["Conversions", campaign.conversions],
            ["ROAS", campaign.roas],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt>{k}</dt>
              <dd className="font-bold text-sense-navy">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-[14px] bg-[#e3eadd] p-3.5">
        <div className="grid shrink-0 justify-items-center">
          <strong className="text-2xl font-semibold text-sense-blue">{score.value}%</strong>
          <span className="text-[10px] text-[#647477]">Performance score</span>
        </div>
        <p className="text-[11px] leading-[1.5] text-[#536669]">{score.note}</p>
      </div>
    </Panel>
  );
}

export default function ReportsDashboard() {
  const today = useToday(); // null until the browser takes over (dates depend on "today")
  const [period, setPeriod] = usePeriod();
  const range = today ? resolvePeriod(period, today) : null;
  const key = range?.key;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the range key captures everything that matters
  const data = useMemo(() => (range ? reportFor(range) : null), [key]);
  const icons = ["chevron", "chevron", "trend", "chevron", "chevron", "chevron"];

  return (
    <div className="w-full">
      <PageTitle
        title="Insights / Reports"
        description={range ? `Showing ${rangeLabel(range.from, range.to)}, compared with the ${range.compareLabel}.` : "\u00a0"}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[34px] cursor-pointer items-center gap-[7px] rounded-[17px] border border-paper/40 px-3.5 text-[11px] font-semibold text-paper transition hover:bg-paper/15 print:hidden"
          >
            <Icon name="upload" size={14} className="rotate-180" /> Download PDF
          </button>
          {today && <PeriodPicker value={period} onChange={setPeriod} today={today} />}
        </div>
      </PageTitle>

      {!data ? (
        <div role="status" aria-label="Loading reports" className="grid gap-[18px] xl:grid-cols-12">
          <SkeletonPanel lines={3} className="xl:col-span-5" />
          <SkeletonPanel lines={4} className="xl:col-span-7" />
        </div>
      ) : (
        <div className="grid gap-[18px] xl:grid-cols-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:col-span-5">
            {data.kpis.map(([label, value, change], i) => (
              <Kpi key={label} label={label} value={value} change={change} compareTo={data.compareTo} icon={icons[i]} />
            ))}
          </div>
          <InsightsPanel key={key} data={data} chartKey={key} />
          <CountryPanel data={data} days={range.days} />
          <CampaignPanel data={data} />
        </div>
      )}

      <SampleNote />
    </div>
  );
}
