"use client";

// Settings → Connected accounts: connect Facebook + Instagram (Facebook Login), see
// what's connected with live numbers, refresh or disconnect.

import { useCallback, useEffect, useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { disconnectMeta, getMetaStatus } from "@/app/actions/meta";

const compact = new Intl.NumberFormat("en", { notation: "compact" });
const num = (n) => (n == null ? "—" : compact.format(n));
const when = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

const btn = "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[20px] px-4 text-[13px] font-bold transition disabled:cursor-default disabled:opacity-60";

function Stat({ label, value }) {
  return (
    <div className="grid gap-0.5 rounded-xl bg-white/70 px-3 py-2">
      <span className="text-xs text-[#4b5d60]">{label}</span>
      <strong className="text-base font-semibold text-sense-blue">{value}</strong>
    </div>
  );
}

function PostRow({ post, metrics }) {
  return (
    <li>
      <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 rounded-xl p-2 transition hover:bg-sense-lime/25">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- Meta CDN thumbnails
          <img src={post.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" loading="lazy" />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-sense-blue/10 text-sense-blue">
            <Icon name="message" size={16} />
          </span>
        )}
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="line-clamp-2 text-[13px] leading-[1.4] text-sense-navy">{post.text || "(no caption)"}</span>
          <span className="text-xs text-[#4b5d60]">
            {[post.type, when(post.time), ...metrics].filter(Boolean).join(" · ")}
          </span>
        </span>
      </a>
    </li>
  );
}

function AccountCard({ icon, title, subtitle, href, stats, error, children }) {
  return (
    <section className="grid gap-3 rounded-2xl border border-sense-blue/12 bg-white/50 p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-sense-blue text-paper">{icon}</span>
        <span className="grid min-w-0 flex-1">
          <strong className="truncate text-sm">{title}</strong>
          <span className="text-[13px] text-[#4b5d60]">{subtitle}</span>
        </span>
        <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[13px] font-bold text-sense-blue underline">
          Open ↗
        </a>
      </div>
      {error && <p role="alert" className="rounded-lg bg-coral-400/10 px-3 py-2 text-[13px] text-coral-400">{error}</p>}
      {stats && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{stats}</div>}
      {children}
    </section>
  );
}

function Avatar({ src, fallback }) {
  // eslint-disable-next-line @next/next/no-img-element -- Meta CDN avatars
  return src ? <img src={src} alt="" className="size-full object-cover" /> : <Icon name={fallback} size={18} />;
}

export default function ConnectionsSection() {
  const [status, setStatus] = useState(null);
  const [loading, startLoading] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();
  const [notice, setNotice] = useState(null); // from the redirect back from Facebook

  const load = useCallback(() => startLoading(async () => setStatus(await getMetaStatus())), []);

  useEffect(() => {
    load();
    // Message from /connect/meta/callback, then tidy the URL.
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("meta");
    const err = params.get("meta_error");
    if (ok || err) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the redirect result
      setNotice(
        err
          ? { error: err }
          : ok === "no_pages"
            ? { error: "Connected, but no Facebook Pages were shared. Reconnect and tick your Page (and its Instagram account) when Facebook asks." }
            : { info: "Facebook and Instagram are connected." },
      );
      history.replaceState(null, "", `${window.location.pathname}#connections`);
    }
  }, [load]);

  const disconnect = () => {
    if (!window.confirm("Disconnect Facebook and Instagram from this workspace?")) return;
    startDisconnect(async () => {
      const res = await disconnectMeta();
      if (res.error) setNotice({ error: res.error });
      else {
        setNotice({ info: "Disconnected." });
        load();
      }
    });
  };

  const overview = status?.overview;

  return (
    <div className="grid gap-4">
      <p className="text-xs leading-[1.6] text-[#3d5053]">
        Connect your Facebook Page and the Instagram professional account linked to it. Sense AI reads your posts and
        their results (read-only); it never posts or changes anything.
      </p>

      {notice && (
        <p role={notice.error ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-xs font-semibold ${notice.error ? "bg-coral-400/10 text-coral-400" : "bg-sense-lime/60 text-sense-navy"}`}>
          {notice.error ?? `✓ ${notice.info}`}
        </p>
      )}

      {!status ? (
        <p className="text-xs text-[#4b5d60]">Loading…</p>
      ) : !status.configured && !status.connected ? (
        <div className="grid gap-2 rounded-2xl border border-dashed border-sense-blue/25 p-4 text-xs leading-[1.6] text-[#3d5053]">
          <strong className="text-sense-blue">Almost ready</strong>
          <p>
            The Meta app isn’t set up yet. Add <code>META_APP_ID</code> and <code>META_APP_SECRET</code> to{" "}
            <code>.env.local</code> and restart the app, then the Connect button appears here.
          </p>
        </div>
      ) : !status.connected ? (
        <a href="/connect/meta/start" className={`${btn} w-max bg-[#1877f2] text-white hover:bg-[#1466d2]`}>
          <Icon name="instagram" size={16} /> Connect Facebook &amp; Instagram
        </a>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-[#4b5d60]">
              Connected{overview?.fbUserName ? ` by ${overview.fbUserName}` : ""}
              {overview?.connectedAt ? ` on ${when(overview.connectedAt)}` : ""}.
              {overview?.tokenExpiresAt && ` Reconnect before ${when(overview.tokenExpiresAt)} to keep it working.`}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={load} disabled={loading} className={`${btn} border border-sense-blue/25 text-sense-blue hover:bg-sense-blue/10`}>
                <Icon name="repeat" size={14} /> {loading ? "Refreshing…" : "Refresh"}
              </button>
              <a href="/connect/meta/start" className={`${btn} border border-sense-blue/25 text-sense-blue hover:bg-sense-blue/10`}>
                Reconnect
              </a>
              <button type="button" onClick={disconnect} disabled={disconnecting} className={`${btn} text-[#b84f4f] hover:bg-[#ff7f7f]/15`}>
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>

          {status.error && <p role="alert" className="rounded-lg bg-coral-400/10 px-3 py-2 text-xs text-coral-400">{status.error}</p>}
          {overview?.pages.length === 0 && (
            <p className="text-xs text-[#3d5053]">No Facebook Pages were shared with SixthSense. Press Reconnect and tick your Page when Facebook asks.</p>
          )}

          {overview?.pages.map((p) => (
            <div key={p.id} className="grid gap-3">
              <AccountCard
                icon={<Avatar src={p.picture} fallback="audience" />}
                title={p.name}
                subtitle="Facebook Page"
                href={p.link}
                error={p.error}
                stats={<Stat label="Followers" value={num(p.followers)} />}
              >
                {p.posts.length > 0 && (
                  <ul className="grid gap-1">
                    {p.posts.map((x) => (
                      <PostRow key={x.id} post={x} metrics={[`${num(x.reactions)} reactions`, `${num(x.comments)} comments`, x.shares ? `${num(x.shares)} shares` : null]} />
                    ))}
                  </ul>
                )}
              </AccountCard>

              {p.instagram ? (
                <AccountCard
                  icon={<Avatar src={p.instagram.picture} fallback="instagram" />}
                  title={`@${p.instagram.username}`}
                  subtitle="Instagram professional account"
                  href={`https://www.instagram.com/${p.instagram.username}/`}
                  error={p.instagram.error}
                  stats={
                    <>
                      <Stat label="Followers" value={num(p.instagram.followers)} />
                      <Stat label="Posts" value={num(p.instagram.postCount)} />
                      <Stat label="Reach, last 7 days" value={num(p.instagram.week?.reach)} />
                      <Stat label="Views, last 7 days" value={num(p.instagram.week?.views)} />
                    </>
                  }
                >
                  {p.instagram.weekError && (
                    <p className="text-xs text-[#4b5d60]">7-day totals unavailable: {p.instagram.weekError}</p>
                  )}
                  {p.instagram.posts.length > 0 ? (
                    <ul className="grid gap-1">
                      {p.instagram.posts.map((x) => (
                        <PostRow key={x.id} post={x} metrics={[`${num(x.likes)} likes`, `${num(x.comments)} comments`]} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-[#4b5d60]">No posts yet.</p>
                  )}
                </AccountCard>
              ) : (
                <p className="rounded-xl border border-dashed border-sense-blue/25 px-3 py-2 text-[13px] text-[#3d5053]">
                  No Instagram account is linked to {p.name}. Link one in the Instagram app (Settings → Account type and tools → switch to a
                  professional account, then connect it to this Page), and press Reconnect.
                </p>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
