module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'vendors',
        'rfq',
        'quotations',
        'approvals',
        'purchase-orders',
        'invoices',
        'reports',
        'ai',
        'blockchain',
        'db',
        'ui',
        'shared',
        'setup',
        'ci',
        'deps',
      ],
    ],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test', 'perf', 'ci', 'revert'],
    ],
  },
};
