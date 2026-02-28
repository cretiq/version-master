import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { VercelInfo } from '../types.js';

const API = 'https://api.vercel.com';
const API_TIMEOUT = 8000;
const PING_TIMEOUT = 5000;

let cachedToken: string | null = null;
const teamSlugCache = new Map<string, string>();

async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    const authPath = join(homedir(), 'Library', 'Application Support', 'com.vercel.cli', 'auth.json');
    const raw = await readFile(authPath, 'utf-8');
    const { token } = JSON.parse(raw);
    cachedToken = token;
    return token;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, token: string, teamId?: string): Promise<any> {
  const url = new URL(path, API);
  if (teamId) url.searchParams.set('teamId', teamId);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(API_TIMEOUT),
  });
  if (!res.ok) return null;
  return res.json();
}

async function getTeamSlug(orgId: string, token: string): Promise<string | null> {
  if (teamSlugCache.has(orgId)) return teamSlugCache.get(orgId)!;
  const data = await apiFetch(`/v2/teams/${orgId}`, token);
  if (!data?.slug) return null;
  teamSlugCache.set(orgId, data.slug);
  return data.slug;
}

interface VercelProject {
  projectId: string;
  orgId: string;
}

async function readVercelProject(repoPath: string): Promise<VercelProject | null> {
  try {
    const raw = await readFile(join(repoPath, '.vercel', 'project.json'), 'utf-8');
    const { projectId, orgId } = JSON.parse(raw);
    if (projectId && orgId) return { projectId, orgId };
    return null;
  } catch {
    return null;
  }
}

async function pingUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${url}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(PING_TIMEOUT),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchVercelInfo(repoPath: string): Promise<VercelInfo | null> {
  const project = await readVercelProject(repoPath);
  if (!project) return null;

  const token = await getToken();
  if (!token) return null;

  const [teamSlug, domainsData, deploymentsData] = await Promise.all([
    getTeamSlug(project.orgId, token),
    apiFetch(`/v9/projects/${project.projectId}/domains`, token, project.orgId),
    apiFetch(`/v6/deployments?projectId=${project.projectId}&target=production&limit=1`, token, project.orgId),
  ]);

  const domains: string[] = domainsData?.domains?.map((d: any) => d.name) ?? [];
  const deployment = deploymentsData?.deployments?.[0] ?? null;

  const prodUrl = domains[0] ?? deployment?.url ?? null;
  const deployState: string | null = deployment?.readyState ?? null;
  const lastDeployAt: number | null = deployment?.created ?? null;

  // Resolve project name from deployment or fall back to projectId
  const projectName = deployment?.name ?? project.projectId;

  let healthy: boolean | null = null;
  if (prodUrl) {
    healthy = await pingUrl(prodUrl);
  }

  return {
    projectName,
    projectId: project.projectId,
    teamSlug,
    prodUrl,
    deployState,
    healthy,
    lastDeployAt,
  };
}
