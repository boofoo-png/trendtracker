"use client";

// Insights / Reports, laid out like the Marketing Intelligence Hub Figma Make app.
// Placeholder data until ad and analytics accounts are connected; swap REPORT_DATA for real values.

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { PageTitle, Panel, SampleNote, Toggle } from "@/components/ui/Dashboard";

const PERIODS = ["7 days", "30 days"];
const METRICS = ["Revenue", "Conversions"];
const SORTS = ["Top countries", "Lowest countries"];

const REPORT_DATA = {
  "7 days": {
    compareTo: "week",
    kpis: [
      ["Total Spend", "$12,450", "+12.5%"],
      ["Revenue", "$89,540", "+12.5%"],
      ["ROAS", "7.2×", "+5%"],
      ["Impressions", "2.53M", "-3.5%"],
      ["Conversions", "7,485", "+122"],
      ["Clicks", "112,576", "-1,235"],
    ],
    peak: { value: "$8,673", change: "+4.5%", note: "Compared to $5,000 last week" },
    insight:
      "Meta delivered the strongest ROAS this week (+18%), while Google's CPA increased by 12%. Thursday recorded your best overall performance, driven by Meta conversions.",
    countries: [
      { name: "United States", Revenue: 20500, Conversions: 1720 },
      { name: "Canada", Revenue: 9800, Conversions: 910 },
      { name: "United Kingdom", Revenue: 8700, Conversions: 830 },
      { name: "Germany", Revenue: 5900, Conversions: 540 },
      { name: "Australia", Revenue: 5100, Conversions: 470 },
    ],
    campaign: { bars: [48, 84, 59, 76, 51, 68], spend: "$5,000", revenue: "$12,000", conversions: "6,000", roas: "2.4×" },
    score: { value: 64, note: "You earned $18,000 this week, outperforming last week by +12%." },
  },
  "30 days": {
    compareTo: "month",
    kpis: [
      ["Total Spend", "$48,820", "+9.8%"],
      ["Revenue", "$342,610", "+15.4%"],
      ["ROAS", "7.0×", "+7%"],
      ["Impressions", "10.8M", "+8.1%"],
      ["Conversions", "28,940", "+864"],
      ["Clicks", "438,220", "+6.7%"],
    ],
    peak: { value: "$31,240", change: "+9.2%", note: "Compared to $28,600 last month" },
    insight:
      "Meta delivered the strongest ROAS this month (+18%), while Google's CPA increased by 12%. Thursdays were consistently your best days, driven by Meta conversions.",
    countries: [
      { name: "United States", Revenue: 81200, Conversions: 6840 },
      { name: "Canada", Revenue: 37900, Conversions: 3520 },
      { name: "United Kingdom", Revenue: 35100, Conversions: 3310 },
      { name: "Germany", Revenue: 22800, Conversions: 2090 },
      { name: "Australia", Revenue: 19600, Conversions: 1880 },
    ],
    campaign: { bars: [55, 72, 66, 88, 61, 79], spend: "$19,500", revenue: "$47,800", conversions: "23,100", roas: "2.5×" },
    score: { value: 71, note: "You earned $71,400 this month, outperforming last month by +9%." },
  },
};

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
      <p className="mt-auto text-[10px] leading-[1.4] text-[#6a787a]">compared to last {compareTo}</p>
    </article>
  );
}

function RevenueChart({ peak }) {
  return (
    <div className="relative min-h-[220px] pt-3.5 pr-0 pb-7 pl-[34px]">
      <div className="absolute inset-[15px_0_32px_34px] bg-[repeating-linear-gradient(to_bottom,rgba(3,82,94,0.1),rgba(3,82,94,0.1)_1px,transparent_1px,transparent_20%)]" />
      <div className="absolute top-1 left-[44%] z-10 grid gap-px rounded-[7px] border border-sense-blue/15 bg-paper/95 px-2.5 py-[7px] text-[10px] shadow-[0_5px_12px_rgba(0,31,62,0.08)]">
        <span className="text-sense-blue">Peak Revenue</span>
        <strong className="text-sense-blue">
          {peak.value}&nbsp; {peak.change}
        </strong>
        <small className="text-[9px] text-[#647477]">{peak.note}</small>
      </div>
      <div className="absolute top-[15px] bottom-8 left-0 flex flex-col justify-between text-[9px] text-sense-blue">
        {["$25k", "$20k", "$15k", "$10k", "$5k", "$0k"].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <svg
        role="img"
        aria-label="Google and Meta revenue trend"
        preserveAspectRatio="none"
        viewBox="0 0 300 160"
        className="absolute inset-[15px_0_32px_34px] h-[calc(100%-47px)] w-[calc(100%-34px)] overflow-visible"
      >
        <defs>
          <linearGradient id="reportArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ddfe56" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ddfe56" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <path d="M0 135 C30 95 48 130 72 122 S105 35 126 100 S165 62 190 83 S240 70 300 45 L300 160 L0 160 Z" fill="url(#reportArea)" />
        <path d="M0 126 C34 88 48 116 75 126 S111 52 132 92 S160 57 194 78 S252 70 300 43" fill="none" stroke="#03525e" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <path d="M0 145 C35 128 55 86 83 125 S117 82 133 38 S154 125 189 91 S235 88 300 57" fill="none" stroke="#83ae72" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute right-0 bottom-[15px] left-[34px] flex justify-between text-[9px] text-sense-blue">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="absolute right-0 bottom-0 left-[34px] flex justify-center gap-[18px] text-[10px] text-[#647477]">
        <span className="flex items-center gap-1">
          <i className="size-1.5 rounded-full bg-sense-blue" /> Google
        </span>
        <span className="flex items-center gap-1">
          <i className="size-1.5 rounded-full bg-[#83ae72]" /> Meta
        </span>
      </div>
    </div>
  );
}

function InsightsPanel({ data, period }) {
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
        <RevenueChart peak={data.peak} />
        <div className="flex flex-col">
          <h4 className="text-xs font-bold text-sense-blue">Insights</h4>
          <p className="mt-[7px] text-[11px] leading-[1.6] text-[#536669]">{data.insight}</p>
          <ul className="mt-2 grid gap-1 text-[11px] text-[#536669]">
            <li><strong className="text-sense-blue">Top performer:</strong> Meta ROAS +18%</li>
            <li><strong className="text-sense-blue">Underperforming:</strong> Google CPA +12%</li>
          </ul>
          {full && (
            <p className="mt-2 text-[11px] leading-[1.6] text-[#536669]">
              <strong className="text-sense-blue">AI suggestion:</strong> Reallocate 10% of spend from
              Google to Meta for a predicted +6% in conversions. Meta&apos;s conversion efficiency is
              strongest on Thursday, so recheck Google CPA after the next {period === "7 days" ? "seven-day" : "30-day"} period.
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

function CountryPanel({ data, period }) {
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
          <dd className="text-xl font-medium text-sense-navy">{period === "7 days" ? "1 week" : "30 days"}</dd>
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
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-sense-blue">Top Campaigns</h3>
        <Icon name="trend" size={16} className="text-sense-blue" />
      </div>
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
            ["Campaign", "Meta"],
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
  const [period, setPeriod] = useState(PERIODS[0]);
  const data = REPORT_DATA[period];
  const icons = ["chevron", "chevron", "trend", "chevron", "chevron", "chevron"];

  return (
    <div className="w-full">
      <PageTitle title="Insights / Reports">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[34px] cursor-pointer items-center gap-[7px] rounded-[17px] border border-paper/40 px-3.5 text-[11px] font-semibold text-paper transition hover:bg-paper/15 print:hidden"
          >
            <Icon name="upload" size={14} className="rotate-180" /> Download PDF
          </button>
          <Toggle label="Time period" options={PERIODS} value={period} onChange={setPeriod} />
        </div>
      </PageTitle>

      <div className="grid gap-[18px] xl:grid-cols-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:col-span-5">
          {data.kpis.map(([label, value, change], i) => (
            <Kpi key={label} label={label} value={value} change={change} compareTo={data.compareTo} icon={icons[i]} />
          ))}
        </div>
        <InsightsPanel key={period} data={data} period={period} />
        <CountryPanel data={data} period={period} />
        <CampaignPanel data={data} />
      </div>

      <SampleNote />
    </div>
  );
}
