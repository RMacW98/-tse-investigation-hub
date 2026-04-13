export const PRODUCT_AREA_RULES = [
  ["agent", "Agent", [
    /\bagent\s*(v?\d|check|flare|config|log|install|upgrad)/i,
    /\bdatadog[\s-]*agent\b/i, /\bprocess[\s-]*agent\b/i,
    /\bsystem[\s-]*probe\b/i, /\bflare\b/i,
    /\bibm[\s_]mq\b/i, /\bintegration\s*(check|error|config)/i,
  ]],
  ["apm", "APM", [
    /\bapm\b/i, /\btrac(e|es|ing)\b/i, /\bdd[\s-]*trace\b/i,
    /\bspan\b/i, /\bservice[\s-]*map/i, /\bddtrace\b/i,
    /\btrace[\s-]*agent\b/i,
  ]],
  ["containers", "Containers", [
    /\bcontainer\b/i, /\bkubernetes\b/i, /\bk8s\b/i, /\becs\b/i,
    /\bdocker\b/i, /\bhelm\b/i, /\bcluster[\s-]*agent\b/i,
    /\bdaemonset\b/i, /\bpod\b/i,
  ]],
  ["cloud", "Cloud / CCM", [
    /\baws\s*integrat/i, /\bazure\s*integrat/i, /\bgcp\s*integrat/i,
    /\bcloud\s*(cost|integrat)/i, /\bccm\b/i,
  ]],
  ["dbm", "Database Monitoring", [
    /\bdbm\b/i, /\bdatabase\s*monitor/i, /\bpostgres\b/i,
    /\bmysql\b/i, /\bsql\s*server\b/i, /\boracle\s*db\b/i,
  ]],
  ["logs", "Logs", [
    /\blog\s*(management|collection|pipeline|parsing|archive|index)/i,
    /\bpipeline\b/i, /\bparsing\s*rule/i, /\blog[\s-]*explorer/i,
  ]],
  ["metrics", "Metrics", [
    /\bmetric\s*(submission|ingestion|volume|cardinality)/i,
    /\bcustom[\s-]*metric/i, /\bdistribution[\s-]*metric/i,
    /\bmetric[\s-]*explorer\b/i,
  ]],
  ["monitors", "Monitors", [
    /\bmonitor\s*(alert|notify|evaluat|downtime|mute)/i,
    /\balert\s*(condition|threshold|notification)/i,
    /\bdowntime\b/i, /\bslo\b/i,
  ]],
  ["network", "Network", [
    /\bnetwork\s*(performance|device|monitor)/i, /\bnpm\b/i,
    /\bnetflow\b/i, /\bdns\s*monitor/i,
  ]],
  ["otel", "OpenTelemetry", [
    /\botel\b/i, /\bopentelemetry\b/i, /\botlp\b/i,
    /\botel[\s-]*collector\b/i,
  ]],
  ["profiling", "Profiling", [
    /\bprofil(e|er|ing)\b/i, /\bcontinuous[\s-]*profil/i,
    /\bflame[\s-]*graph\b/i,
  ]],
  ["rum", "RUM", [
    /\brum\b/i, /\breal[\s-]*user[\s-]*monitor/i, /\bsession[\s-]*replay/i,
    /\bbrowser[\s-]*sdk\b/i,
  ]],
  ["security", "Security", [
    /\bsecurity\b/i, /\bappsec\b/i, /\bsiem\b/i, /\bcspm\b/i,
    /\bcws\b/i, /\bvulnerability\s*manage/i, /\bcloud[\s-]*security\b/i,
  ]],
  ["serverless", "Serverless", [
    /\bserverless\b/i, /\blambda\b/i, /\bazure[\s-]*function/i,
    /\bcloud[\s-]*function/i, /\bstep[\s-]*function/i,
  ]],
  ["service_mgmt", "Service Management", [
    /\bincident\s*(app|manage)/i, /\bworkflow\s*automation/i,
    /\bcase[\s-]*management\b/i, /\bevent[\s-]*management/i,
    /\bapp[\s-]*builder\b/i,
  ]],
  ["synthetics", "Synthetics", [
    /\bsynthetic/i, /\bapi[\s-]*test/i, /\bbrowser[\s-]*test/i,
    /\bcontinuous[\s-]*testing/i,
  ]],
  ["platform", "Platform", [
    /\bbilling\b/i, /\bsso\b/i, /\bsaml\b/i, /\bapi[\s-]*key/i,
    /\bdashboard\s*(widget|template|api)/i,
    /\brbac\b/i, /\baudit[\s-]*trail/i, /\bgraphing\b/i,
  ]],
  ["other", "Other", []],
];

export const PRODUCT_AREA_LABELS = Object.fromEntries(
  PRODUCT_AREA_RULES.map(([key, label]) => [key, label])
);

export const TEE_BOARDS = {
  agent:        { project: "AGENT",  url: "https://datadoghq.atlassian.net/jira/software/c/projects/AGENT/boards/469",  team: "Agent",              email: "tee-agent-core@datadoghq.com" },
  apm:          { project: "SRTEE",  url: "https://datadoghq.atlassian.net/jira/software/c/projects/SRTEE/boards/5545", team: "APM",                email: "tee-apm@datadoghq.com" },
  containers:   { project: "CONS",   url: "https://datadoghq.atlassian.net/browse/CONS",                                team: "Containers",         email: "tee-containers@datadoghq.com" },
  cloud:        { project: "CLOUDS", url: "https://datadoghq.atlassian.net/browse/CLOUDS",                              team: "Cloud / CCM",        email: "tee-cloud-integrations@datadoghq.com" },
  dbm:          { project: "DBM",    url: "https://datadoghq.atlassian.net/browse/DBM",                                 team: "Database Monitoring", email: "tee-dbm@datadoghq.com" },
  logs:         { project: "LOGSS",  url: "https://datadoghq.atlassian.net/browse/LOGSS",                               team: "Logs",               email: "tee-logs@datadoghq.com" },
  metrics:      { project: "METS",   url: "https://datadoghq.atlassian.net/browse/METS",                                team: "Metrics",            email: "tee-metrics@datadoghq.com" },
  monitors:     { project: "MNTS",   url: "https://datadoghq.atlassian.net/browse/MNTS",                                team: "Monitors",           email: "tee-monitors@datadoghq.com" },
  network:      { project: "NETS",   url: "https://datadoghq.atlassian.net/browse/NETS",                                team: "Network",            email: "" },
  otel:         { project: "OTELS",  url: "https://datadoghq.atlassian.net/jira/software/c/projects/OTELS/boards/2935", team: "OpenTelemetry",      email: "tee-otel@datadoghq.com" },
  profiling:    { project: "SCP",    url: "https://datadoghq.atlassian.net/browse/SCP",                                 team: "Profiling",          email: "tee-profiling@datadoghq.com" },
  rum:          { project: "RUMS",   url: "https://datadoghq.atlassian.net/jira/software/c/projects/RUMS/boards/731",   team: "RUM",                email: "tee-rum@datadoghq.com" },
  security:     { project: "SCRS",   url: "https://datadoghq.atlassian.net/browse/SCRS",                                team: "Security",           email: "tee-security@datadoghq.com" },
  serverless:   { project: "SLES",   url: "https://datadoghq.atlassian.net/browse/SLES",                                team: "Serverless",         email: "tee-serverless@datadoghq.com" },
  service_mgmt: { project: "SOCE",   url: "https://datadoghq.atlassian.net/browse/SOCE",                                team: "Service Management", email: "" },
  synthetics:   { project: "SYN",    url: "https://datadoghq.atlassian.net/browse/SYN",                                 team: "Synthetics",         email: "tee-synthetics@datadoghq.com" },
  platform:     { project: "WEBPS",  url: "https://datadoghq.atlassian.net/jira/software/c/projects/WEBPS/boards/473",  team: "Web Platform",       email: "tee-web-platform@datadoghq.com" },
};

export function detectProductArea(text) {
  for (const [key, , patterns] of PRODUCT_AREA_RULES) {
    for (const pat of patterns) {
      if (pat.test(text)) return key;
    }
  }
  return "other";
}
