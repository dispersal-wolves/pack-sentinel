console.log(JSON.stringify({
  schema: 'dispersal-wolves/demo/v1',
  findings: [
    { kind: 'host.firewall', title: 'Firewall profile needs review', detail: 'The demo profile contains an unexpected inbound rule.', severity: 'medium' },
    { kind: 'network.listener.added', title: 'New listener in baseline', detail: 'A demo service is listening on port 8443.', severity: 'low' }
  ]
}));
