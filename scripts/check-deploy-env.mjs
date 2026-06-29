const target = process.env.DADBUDS_DEPLOY_TARGET ?? "landing";
const apiRequiredTargets = new Set(["shadow", "prod-app"]);

function fail(message) {
  console.error(`\nDadBuds deploy config error: ${message}\n`);
  process.exit(1);
}

if (process.env.DADBUDS_SKIP_DEPLOY_ENV_CHECK === "1") {
  process.exit(0);
}

if (!apiRequiredTargets.has(target)) {
  process.exit(0);
}

const apiUrl = process.env.VITE_API_URL?.trim();

if (!apiUrl) {
  fail(
    `${target} builds require VITE_API_URL so the deployed app does not point at localhost.`,
  );
}

let parsed;
try {
  parsed = new URL(apiUrl);
} catch {
  fail(`VITE_API_URL must be a full URL. Received: ${apiUrl}`);
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
if (
  localHosts.has(parsed.hostname) &&
  process.env.DADBUDS_ALLOW_LOCAL_API !== "1"
) {
  fail(
    `${target} builds cannot use local API URL ${apiUrl}. Set a hosted API URL, or set DADBUDS_ALLOW_LOCAL_API=1 only for local testing.`,
  );
}
