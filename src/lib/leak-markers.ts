/*
 * Leak markers for a PUBLIC repository. Anything pushed to any branch of this
 * repo is public, so the validator scans every file the site is built from
 * and refuses the build when one of these appears.
 *
 * The list follows the intent of LabSmith's prohibited learner markers
 * without importing across repos: no home or workspace paths, no keys or
 * tokens, no credentials, no host or management addresses, no image digests,
 * no authoring internals and no raw device output. Lab addresses are fine:
 * the labs use the documentation ranges (192.0.2.0/24, 198.51.100.0/24,
 * 203.0.113.0/24) and private ranges inside the lab itself.
 *
 * This file and the validator's own test hold the patterns, so the scan
 * skips exactly those two files and nothing else.
 */

export type LeakMarker = { id: string; description: string; pattern: RegExp };

export const LEAK_MARKERS: readonly LeakMarker[] = [
  { id: "home-path", description: "a home-folder path", pattern: /\/(?:Users|home)\/[A-Za-z0-9._-]+|[A-Za-z]:\\Users\\/ },
  { id: "workspace-path", description: "a private workspace folder name", pattern: /juniper_lessons|control-corpus|\.worktrees\/|\.completion-attempts|side-session-notes/ },
  { id: "ssh-key", description: "an SSH key file or private key", pattern: /\bid_(?:rsa|ed25519|ecdsa)\b|\.ssh\/|BEGIN [A-Z ]*PRIVATE KEY/ },
  { id: "token", description: "an access token", pattern: /\bghp_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bsk-ant-[A-Za-z0-9-]{10,}|\bxox[abp]-[A-Za-z0-9-]{10,}|\bAKIA[0-9A-Z]{16}\b|\bvercel_blob_rw_[A-Za-z0-9_]{10,}/ },
  { id: "credential", description: "a credential", pattern: /admin@123|\bpassw(?:or)?d\s*[:=]\s*\S|encrypted-password\s+"?\$|\$(?:1|5|6|9)\$[A-Za-z0-9./$]{8,}/i },
  { id: "image-digest", description: "an image digest", pattern: /\bsha256:[0-9a-f]{12,}/i },
  { id: "host-address", description: "a home-network or management address", pattern: /\b192\.168\.\d{1,3}\.\d{1,3}\b|\b172\.20\.20\.\d{1,3}\b|\b100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/ },
  { id: "host-name", description: "a private host name", pattern: /\b[A-Za-z0-9-]+\.(?:ts\.net|home\.arpa|lan)\b|\b[A-Za-z0-9-]+\.local\b(?!\w)/ },
  { id: "personal-email", description: "a personal email address", pattern: /[A-Za-z0-9._%+-]+@(?:gmail\.com|icloud\.com|privaterelay\.appleid\.com|outlook\.com|hotmail\.com)/i },
  { id: "authoring-internal", description: "a lab-authoring internal", pattern: /\.authoring\/|run-record|receiptId|topologyName|imageDigest|installationSha256|platformBindingSha256|labsmith:\/\/|\.qualification\// },
  { id: "device-output", description: "raw device output", pattern: /\binet6?\.0: \d+ destinations\b|Physical interface: |Last flapped|\{(?:master|primary|backup)(?::\d+)?\}|^[a-z][\w-]*@[\w-]+[>#] /m },
];

export type LeakFinding = { marker: string; description: string; line: number; excerpt: string };

export function scanText(text: string): LeakFinding[] {
  const findings: LeakFinding[] = [];
  const lines = text.split(/\r?\n/);
  for (const marker of LEAK_MARKERS) {
    const flags = marker.pattern.flags.replace("g", "");
    const re = new RegExp(marker.pattern.source, flags);
    lines.forEach((line, i) => {
      const m = re.exec(line);
      if (m) {
        const start = Math.max(0, m.index - 20);
        findings.push({ marker: marker.id, description: marker.description, line: i + 1, excerpt: line.slice(start, m.index + m[0].length + 20).trim() });
      }
    });
  }
  return findings;
}
