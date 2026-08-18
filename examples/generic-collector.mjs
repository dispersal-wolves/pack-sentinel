const finding = {
  kind: 'example.control.changed',
  title: 'Example control changed',
  summary: 'A deterministic example for adapter development.',
  severity: 'low'
};
process.stdout.write(JSON.stringify({ schema: 'example/collector/v1', findings: [finding] }));
