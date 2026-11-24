"use server";

// Settings → Connected accounts. Never returns tokens.

import { currentWorkspace } from "@/lib/trendStore";
import { connectionOverview, deleteConnection, getConnection, isMetaConfigured } from "@/lib/meta";

/** { configured, connected, overview?, error? } */
export async function getMetaStatus() {
  const configured = isMetaConfigured();
  const { workspaceId } = await currentWorkspace();
  if (!workspaceId) return { configured, connected: false, error: "Not signed in." };
  const conn = await getConnection(workspaceId);
  if (!conn) return { configured, connected: false };
  try {
    return { configured, connected: true, overview: await connectionOverview(conn) };
  } catch (err) {
    return { configured, connected: true, error: err.message };
  }
}

export async function disconnectMeta() {
  const { workspaceId } = await currentWorkspace();
  if (!workspaceId) return { error: "Not signed in." };
  try {
    await deleteConnection(workspaceId);
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}
