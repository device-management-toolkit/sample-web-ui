/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const mocha = require('mocha')
const fs = require('fs')
const path = require('path')

class CustomTabularReporter extends mocha.reporters.Spec {
  constructor(runner, options) {
    super(runner, options)

    const reportData = {
      suites: [],
      totals: {
        suites: 0,
        tests: 0,
        passes: 0,
        failures: 0,
        pending: 0,
        skipped: 0
      },
      startTime: null,
      endTime: null
    }

    let topLevelSuite = null
    let currentContext = null
    const suiteStack = []

    runner.on('start', () => {
      reportData.startTime = new Date()
    })

    runner.on('suite', (suite) => {
      if (suite.root) return
      
      suiteStack.push(suite)
      
      // Top-level suite (describe)
      if (suiteStack.length === 1) {
        reportData.totals.suites++
        topLevelSuite = {
          name: suite.title,
          contexts: [],
          stats: {
            passes: 0,
            failures: 0,
            pending: 0,
            skipped: 0,
            total: 0
          }
        }
        reportData.suites.push(topLevelSuite)
        currentContext = null
      }
      // Nested suite (context)
      else if (suiteStack.length === 2 && topLevelSuite) {
        currentContext = {
          name: suite.title,
          tests: [],
          stats: {
            passes: 0,
            failures: 0,
            pending: 0,
            skipped: 0,
            total: 0
          }
        }
        topLevelSuite.contexts.push(currentContext)
      }
    })

    runner.on('suite end', (suite) => {
      if (suite.root) return
      suiteStack.pop()
      
      if (suiteStack.length === 0) {
        topLevelSuite = null
        currentContext = null
      } else if (suiteStack.length === 1) {
        currentContext = null
      }
    })

    runner.on('pass', (test) => {
      const testData = {
        name: test.title,
        status: 'PASS',
        duration: test.duration
      }
      
      if (currentContext) {
        // Test under context
        currentContext.tests.push(testData)
        currentContext.stats.passes++
        currentContext.stats.total++
      } else if (topLevelSuite) {
        // Test directly under suite (no context)
        if (!topLevelSuite.tests) {
          topLevelSuite.tests = []
        }
        topLevelSuite.tests.push(testData)
      }
      
      if (topLevelSuite) {
        topLevelSuite.stats.passes++
        topLevelSuite.stats.total++
      }
      
      reportData.totals.passes++
      reportData.totals.tests++
    })

    runner.on('fail', (test) => {
      const testData = {
        name: test.title,
        status: 'FAIL',
        duration: test.duration,
        error: test.err.message
      }
      
      if (currentContext) {
        currentContext.tests.push(testData)
        currentContext.stats.failures++
        currentContext.stats.total++
      } else if (topLevelSuite) {
        if (!topLevelSuite.tests) {
          topLevelSuite.tests = []
        }
        topLevelSuite.tests.push(testData)
      }
      
      if (topLevelSuite) {
        topLevelSuite.stats.failures++
        topLevelSuite.stats.total++
      }
      
      reportData.totals.failures++
      reportData.totals.tests++
    })

    runner.on('pending', (test) => {
      const testData = {
        name: test.title,
        status: 'SKIP',
        duration: 0
      }
      
      if (currentContext) {
        currentContext.tests.push(testData)
        currentContext.stats.pending++
        currentContext.stats.total++
      } else if (topLevelSuite) {
        if (!topLevelSuite.tests) {
          topLevelSuite.tests = []
        }
        topLevelSuite.tests.push(testData)
      }
      
      if (topLevelSuite) {
        topLevelSuite.stats.pending++
        topLevelSuite.stats.total++
      }
      
      reportData.totals.pending++
      reportData.totals.tests++
    })

    runner.on('end', () => {
      reportData.endTime = new Date()
      this.generateReport(reportData, options)
    })
  }

  generateReport(data, options) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const baseReportDir = options.reporterOptions?.reportDir || 'cypress/reports'
    
    // Get spec file name from first suite or use default
    const specName = data.suites.length > 0 
      ? data.suites[0].name.split(/[\/\\]/).pop().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      : 'test'
    
    // Create subfolder for this spec file run
    const reportSubDir = path.join(baseReportDir, `${specName}-${timestamp}`)
    const reportName = 'report'

    // Create report subdirectory if it doesn't exist
    if (!fs.existsSync(reportSubDir)) {
      fs.mkdirSync(reportSubDir, { recursive: true })
    }

    // Generate text report
    const textReport = this.generateTextReport(data)
    fs.writeFileSync(path.join(reportSubDir, `${reportName}.txt`), textReport)

    // Generate CSV report
    const csvReport = this.generateCSVReport(data)
    fs.writeFileSync(path.join(reportSubDir, `${reportName}.csv`), csvReport)

    // Generate JSON report
    fs.writeFileSync(path.join(reportSubDir, `${reportName}.json`), JSON.stringify(data, null, 2))

    // Generate HTML report for this spec
    const htmlReport = this.generateHTMLReport(data)
    fs.writeFileSync(path.join(reportSubDir, `${reportName}.html`), htmlReport)

    console.log('\n' + '='.repeat(100))
    console.log('📊 TEST REPORT GENERATED:')
    console.log(`   - Report Folder: ${reportSubDir}`)
    console.log(`   - Text Report: ${path.join(reportSubDir, `${reportName}.txt`)}`)
    console.log(`   - CSV Report:  ${path.join(reportSubDir, `${reportName}.csv`)}`)
    console.log(`   - JSON Report: ${path.join(reportSubDir, `${reportName}.json`)}`)
    console.log(`   - HTML Report: ${path.join(reportSubDir, `${reportName}.html`)}`)
    console.log('='.repeat(100) + '\n')
    
    // Try to generate consolidated report (will aggregate all runs)
    this.generateConsolidatedReport(baseReportDir)
  }

  generateConsolidatedReport(baseReportDir) {
    try {
      // Find all JSON report files in subdirectories
      const allReports = []
      const entries = fs.readdirSync(baseReportDir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const jsonPath = path.join(baseReportDir, entry.name, 'report.json')
          if (fs.existsSync(jsonPath)) {
            const reportData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
            allReports.push({
              folder: entry.name,
              data: reportData,
              timestamp: new Date(reportData.startTime)
            })
          }
        }
      }

      if (allReports.length === 0) return

      // Sort reports by execution time (chronological order)
      allReports.sort((a, b) => a.timestamp - b.timestamp)

      // Combine all reports into one
      const consolidatedData = {
        suites: [],
        totals: {
          suites: 0,
          tests: 0,
          passes: 0,
          failures: 0,
          pending: 0,
          skipped: 0
        },
        startTime: new Date(Math.min(...allReports.map(r => new Date(r.data.startTime)))),
        endTime: new Date(Math.max(...allReports.map(r => new Date(r.data.endTime)))),
        reports: allReports.map(r => r.folder)
      }

      // Aggregate all suites and totals
      for (const report of allReports) {
        consolidatedData.suites.push(...report.data.suites)
        consolidatedData.totals.suites += report.data.totals.suites
        consolidatedData.totals.tests += report.data.totals.tests
        consolidatedData.totals.passes += report.data.totals.passes
        consolidatedData.totals.failures += report.data.totals.failures
        consolidatedData.totals.pending += report.data.totals.pending
        consolidatedData.totals.skipped += report.data.totals.skipped
      }

      // Generate consolidated HTML report
      const consolidatedHTML = this.generateConsolidatedHTMLReport(consolidatedData)
      fs.writeFileSync(path.join(baseReportDir, 'consolidated-report.html'), consolidatedHTML)
      
      // Generate consolidated JSON
      fs.writeFileSync(path.join(baseReportDir, 'consolidated-report.json'), JSON.stringify(consolidatedData, null, 2))

      console.log('📊 CONSOLIDATED REPORT UPDATED:')
      console.log(`   - HTML Report: ${path.join(baseReportDir, 'consolidated-report.html')}`)
      console.log(`   - JSON Report: ${path.join(baseReportDir, 'consolidated-report.json')}`)
      console.log(`   - Total Spec Runs: ${allReports.length}`)
      console.log('='.repeat(100) + '\n')
    } catch (err) {
      // Silently fail if consolidation doesn't work
      console.log('⚠️  Could not generate consolidated report:', err.message)
    }
  }

  generateConsolidatedHTMLReport(data) {
    const duration = ((data.endTime - data.startTime) / 1000).toFixed(2)
    const successRate = data.totals.tests > 0 ? ((data.totals.passes / data.totals.tests) * 100).toFixed(2) : '0.00'
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consolidated Cypress Test Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      color: white;
      padding: 30px 40px;
      border-bottom: 4px solid #4299e1;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .header h1::before {
      content: "📊";
      font-size: 32px;
    }
    
    .header-badge {
      display: inline-block;
      background: #4299e1;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-left: 12px;
    }
    
    .header-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .header-meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .header-meta-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
    }
    
    .header-meta-value {
      font-size: 16px;
      font-weight: 600;
    }
    
    .summary {
      background: #f7fafc;
      padding: 30px 40px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .summary h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #2d3748;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }
    
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .summary-card-value {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .summary-card-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      font-weight: 600;
    }
    
    .summary-card.total { border-top: 4px solid #4299e1; }
    .summary-card.total .summary-card-value { color: #4299e1; }
    
    .summary-card.passed { border-top: 4px solid #48bb78; }
    .summary-card.passed .summary-card-value { color: #48bb78; }
    
    .summary-card.failed { border-top: 4px solid #f56565; }
    .summary-card.failed .summary-card-value { color: #f56565; }
    
    .summary-card.skipped { border-top: 4px solid #ed8936; }
    .summary-card.skipped .summary-card-value { color: #ed8936; }
    
    .summary-card.rate { border-top: 4px solid #9f7aea; }
    .summary-card.rate .summary-card-value { color: #9f7aea; }
    
    .summary-card.runs { border-top: 4px solid #38b2ac; }
    .summary-card.runs .summary-card-value { color: #38b2ac; }
    
    .content {
      padding: 30px 40px;
    }
    
    .content h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #2d3748;
    }
    
    .suite {
      margin-bottom: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      transition: box-shadow 0.2s;
    }
    
    .suite:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .suite-header {
      background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
      padding: 18px 24px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
      user-select: none;
    }
    
    .suite-header:hover {
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    }
    
    .suite-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    
    .suite-toggle {
      font-size: 18px;
      transition: transform 0.3s;
      color: #4a5568;
    }
    
    .suite.expanded .suite-toggle {
      transform: rotate(90deg);
    }
    
    .suite-name {
      font-weight: 600;
      font-size: 15px;
      color: #2d3748;
    }
    
    .suite-stats {
      display: flex;
      gap: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .stat-pass { color: #48bb78; }
    .stat-fail { color: #f56565; }
    .stat-skip { color: #ed8936; }
    
    .suite-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }
    
    .suite.expanded .suite-body {
      max-height: 5000px;
      transition: max-height 0.5s ease-in;
    }
    
    .tests-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .tests-table thead {
      background: #f7fafc;
    }
    
    .tests-table th {
      padding: 12px 20px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .tests-table tbody tr {
      border-bottom: 1px solid #f7fafc;
      transition: background 0.15s;
    }
    
    .tests-table tbody tr:hover {
      background: #f7fafc;
    }
    
    .tests-table tbody tr:last-child {
      border-bottom: none;
    }
    
    .tests-table td {
      padding: 14px 20px;
      font-size: 14px;
    }
    
    .test-name {
      color: #2d3748;
      font-weight: 500;
    }
    
    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-pass {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .status-fail {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .status-skip {
      background: #feebc8;
      color: #7c2d12;
    }
    
    .duration {
      color: #718096;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    
    .error-row {
      background: #fff5f5 !important;
    }
    
    .error-message {
      padding: 14px 20px;
      color: #c53030;
      font-size: 13px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-word;
      border-left: 3px solid #fc8181;
      background: #fff5f5;
      margin: 0 20px 14px 20px;
      border-radius: 4px;
    }
    
    .footer {
      background: #2d3748;
      color: white;
      padding: 20px 40px;
      text-align: center;
      font-size: 13px;
      opacity: 0.8;
    }
    
    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    .btn-primary {
      background: #4299e1;
      color: white;
    }
    
    .btn-primary:hover {
      background: #3182ce;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(66, 153, 225, 0.3);
    }
    
    .btn-secondary {
      background: #718096;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #4a5568;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(74, 85, 104, 0.3);
    }
    
    .spec-runs-info {
      background: #edf2f7;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #2d3748;
    }
    
    .spec-runs-info strong {
      color: #2d3748;
    }
    
    .context-row {
      background: #edf2f7 !important;
      font-weight: 700;
    }
    
    .context-name {
      color: #2d3748;
      font-size: 15px;
      padding: 16px 20px !important;
      border-top: 2px solid #cbd5e0;
      border-bottom: 2px solid #cbd5e0;
    }
    
    .subtest-row {
      background: #f7fafc;
    }
    
    .subtest-row:hover {
      background: #edf2f7 !important;
    }
    
    .subtest-name {
      padding-left: 40px !important;
      color: #4a5568;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Consolidated Cypress Test Report<span class="header-badge">All Runs</span></h1>
      <div class="header-meta">
        <div class="header-meta-item">
          <span class="header-meta-label">Started</span>
          <span class="header-meta-value">${data.startTime.toLocaleString()}</span>
        </div>
        <div class="header-meta-item">
          <span class="header-meta-label">Ended</span>
          <span class="header-meta-value">${data.endTime.toLocaleString()}</span>
        </div>
        <div class="header-meta-item">
          <span class="header-meta-label">Total Duration</span>
          <span class="header-meta-value">${duration}s</span>
        </div>
        <div class="header-meta-item">
          <span class="header-meta-label">Spec Runs</span>
          <span class="header-meta-value">${data.reports.length}</span>
        </div>
      </div>
    </div>
    
    <div class="summary">
      <h2>Overall Summary (All Test Runs)</h2>
      <div class="summary-grid">
        <div class="summary-card total">
          <div class="summary-card-value">${data.totals.suites}</div>
          <div class="summary-card-label">Test Suites</div>
        </div>
        <div class="summary-card total">
          <div class="summary-card-value">${data.totals.tests}</div>
          <div class="summary-card-label">Total Tests</div>
        </div>
        <div class="summary-card passed">
          <div class="summary-card-value">${data.totals.passes}</div>
          <div class="summary-card-label">TOTAL PASS</div>
        </div>
        <div class="summary-card failed">
          <div class="summary-card-value">${data.totals.failures}</div>
          <div class="summary-card-label">TOTAL FAIL</div>
        </div>
        <div class="summary-card skipped">
          <div class="summary-card-value">${data.totals.pending}</div>
          <div class="summary-card-label">TOTAL BLOCK</div>
        </div>
        <div class="summary-card rate">
          <div class="summary-card-value">${successRate}%</div>
          <div class="summary-card-label">Success Rate</div>
        </div>
      </div>
    </div>
    
    <div class="content">
      <h2>All Test Suites (${data.totals.suites} suites from ${data.reports.length} runs)</h2>
      <div class="spec-runs-info">
        <strong>Spec Runs Included:</strong> ${data.reports.join(', ')}
      </div>
      <div class="controls">
        <button class="btn btn-primary" onclick="expandAll()">▼ Expand All</button>
        <button class="btn btn-secondary" onclick="collapseAll()">▶ Collapse All</button>
      </div>
      <div class="suites">
        ${data.suites.map((suite, index) => this.generateSuiteHTML(suite, index)).join('')}
      </div>
    </div>
    
    <div class="footer">
      Generated on ${new Date().toLocaleString()} | Cypress Consolidated Reporter | ${data.reports.length} Spec Run(s)
    </div>
  </div>
  
  <script>
    function toggleSuite(index) {
      const suite = document.getElementById('suite-' + index);
      suite.classList.toggle('expanded');
    }
    
    function expandAll() {
      const suites = document.querySelectorAll('.suite');
      suites.forEach(suite => suite.classList.add('expanded'));
    }
    
    function collapseAll() {
      const suites = document.querySelectorAll('.suite');
      suites.forEach(suite => suite.classList.remove('expanded'));
    }
  </script>
</body>
</html>`
    
    return html
  }

  generateTextReport(data) {
    const lines = []
    const divider = '='.repeat(120)
    const subDivider = '-'.repeat(120)

    // Header
    lines.push(divider)
    lines.push('                                    CYPRESS TEST EXECUTION REPORT')
    lines.push(divider)
    lines.push(`Test Execution Started:  ${data.startTime.toLocaleString()}`)
    lines.push(`Test Execution Ended:    ${data.endTime.toLocaleString()}`)
    lines.push(`Total Duration:          ${((data.endTime - data.startTime) / 1000).toFixed(2)}s`)
    lines.push(divider)
    lines.push('')

    // Summary
    lines.push('OVERALL SUMMARY')
    lines.push(subDivider)
    lines.push(`Total Test Suites:       ${data.totals.suites}`)
    lines.push(`Total Test Cases:        ${data.totals.tests}`)
    lines.push(`  ✓ Passed:              ${data.totals.passes}`)
    lines.push(`  ✗ Failed:              ${data.totals.failures}`)
    lines.push(`  ⊘ Skipped/Pending:     ${data.totals.pending}`)
    lines.push(`Success Rate:            ${((data.totals.passes / data.totals.tests) * 100).toFixed(2)}%`)
    lines.push(subDivider)
    lines.push('')

    // Detailed Results by Suite
    lines.push('DETAILED TEST RESULTS BY SUITE')
    lines.push(divider)
    lines.push('')

    data.suites.forEach((suite, index) => {
      lines.push(`Suite ${index + 1}: ${suite.name}`)
      lines.push(subDivider)
      lines.push(`Total Tests: ${suite.stats.total} | Pass: ${suite.stats.passes} | Fail: ${suite.stats.failures} | Skip: ${suite.stats.pending}`)
      lines.push('')

      // Check if suite has contexts (hierarchical structure)
      if (suite.contexts && suite.contexts.length > 0) {
        // Hierarchical structure: contexts with tests
        suite.contexts.forEach((context) => {
          lines.push(`  Context: ${context.name}`)
          lines.push(`  ${'-'.repeat(78)}`)
          lines.push(this.padRight('    Sub-Test Case Name', 80) + this.padRight('Status', 15) + this.padRight('Duration', 15))
          
          context.tests.forEach((test) => {
            const statusIcon = test.status === 'PASS' ? '✓' : test.status === 'FAIL' ? '✗' : '⊘'
            const status = `${statusIcon} ${test.status}`
            const duration = test.duration ? `${test.duration}ms` : 'N/A'
            
            lines.push(
              this.padRight(`      ${test.name}`, 80) +
              this.padRight(status, 15) +
              this.padRight(duration, 15)
            )

            if (test.status === 'FAIL' && test.error) {
              lines.push(`        Error: ${test.error.substring(0, 100)}${test.error.length > 100 ? '...' : ''}`)
            }
          })
          lines.push('')
        })
        
        // Direct tests under suite (if any)
        if (suite.tests && suite.tests.length > 0) {
          lines.push(this.padRight('  Test Case Name', 80) + this.padRight('Status', 15) + this.padRight('Duration', 15))
          lines.push('-'.repeat(80) + '-'.repeat(15) + '-'.repeat(15))
          
          suite.tests.forEach((test) => {
            const statusIcon = test.status === 'PASS' ? '✓' : test.status === 'FAIL' ? '✗' : '⊘'
            const status = `${statusIcon} ${test.status}`
            const duration = test.duration ? `${test.duration}ms` : 'N/A'
            
            lines.push(
              this.padRight(`    ${test.name}`, 80) +
              this.padRight(status, 15) +
              this.padRight(duration, 15)
            )

            if (test.status === 'FAIL' && test.error) {
              lines.push(`      Error: ${test.error.substring(0, 100)}${test.error.length > 100 ? '...' : ''}`)
            }
          })
        }
      } else {
        // Flat structure (no contexts)
        lines.push(this.padRight('  Test Case Name', 80) + this.padRight('Status', 15) + this.padRight('Duration', 15))
        lines.push('-'.repeat(80) + '-'.repeat(15) + '-'.repeat(15))

        const tests = suite.tests || []
        tests.forEach((test) => {
          const statusIcon = test.status === 'PASS' ? '✓' : test.status === 'FAIL' ? '✗' : '⊘'
          const status = `${statusIcon} ${test.status}`
          const duration = test.duration ? `${test.duration}ms` : 'N/A'
          
          lines.push(
            this.padRight(`    ${test.name}`, 80) +
            this.padRight(status, 15) +
            this.padRight(duration, 15)
          )

          if (test.status === 'FAIL' && test.error) {
            lines.push(`      Error: ${test.error.substring(0, 100)}${test.error.length > 100 ? '...' : ''}`)
          }
        })
      }

      lines.push('')
      lines.push('')
    })

    lines.push(divider)
    lines.push('END OF REPORT')
    lines.push(divider)

    return lines.join('\n')
  }

  generateCSVReport(data) {
    const lines = []

    // Header
    lines.push('Suite Name,Test Case / Context,Sub-Test,Status,Duration (ms),Error Message')

    // Data rows
    data.suites.forEach((suite) => {
      // Check if suite has contexts (hierarchical structure)
      if (suite.contexts && suite.contexts.length > 0) {
        suite.contexts.forEach((context) => {
          context.tests.forEach((test) => {
            const error = test.error ? `"${test.error.replace(/"/g, '""')}"` : ''
            lines.push(`"${suite.name}","${context.name}","${test.name}",${test.status},${test.duration || 0},${error}`)
          })
        })
        // Direct tests under suite (if any)
        if (suite.tests && suite.tests.length > 0) {
          suite.tests.forEach((test) => {
            const error = test.error ? `"${test.error.replace(/"/g, '""')}"` : ''
            lines.push(`"${suite.name}","","${test.name}",${test.status},${test.duration || 0},${error}`)
          })
        }
      } else {
        // Flat structure (no contexts)
        const tests = suite.tests || []
        tests.forEach((test) => {
          const error = test.error ? `"${test.error.replace(/"/g, '""')}"` : ''
          lines.push(`"${suite.name}","${test.name}","",${test.status},${test.duration || 0},${error}`)
        })
      }
    })

    // Summary rows
    lines.push('')
    lines.push('SUMMARY')
    lines.push(`Total Suites,${data.totals.suites}`)
    lines.push(`Total Tests,${data.totals.tests}`)
    lines.push(`Passed,${data.totals.passes}`)
    lines.push(`Failed,${data.totals.failures}`)
    lines.push(`Skipped,${data.totals.pending}`)
    lines.push(`Success Rate,${((data.totals.passes / data.totals.tests) * 100).toFixed(2)}%`)

    return lines.join('\n')
  }

  generateHTMLReport(data) {
    const duration = ((data.endTime - data.startTime) / 1000).toFixed(2)
    const successRate = ((data.totals.passes / data.totals.tests) * 100).toFixed(2)
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cypress Test Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      color: white;
      padding: 30px 40px;
      border-bottom: 4px solid #4299e1;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .header h1::before {
      content: "📊";
      font-size: 32px;
    }
    
    .header-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .header-meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .header-meta-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
    }
    
    .header-meta-value {
      font-size: 16px;
      font-weight: 600;
    }
    
    .summary {
      background: #f7fafc;
      padding: 30px 40px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .summary h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #2d3748;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }
    
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .summary-card-value {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .summary-card-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      font-weight: 600;
    }
    
    .summary-card.total { border-top: 4px solid #4299e1; }
    .summary-card.total .summary-card-value { color: #4299e1; }
    
    .summary-card.passed { border-top: 4px solid #48bb78; }
    .summary-card.passed .summary-card-value { color: #48bb78; }
    
    .summary-card.failed { border-top: 4px solid #f56565; }
    .summary-card.failed .summary-card-value { color: #f56565; }
    
    .summary-card.skipped { border-top: 4px solid #ed8936; }
    .summary-card.skipped .summary-card-value { color: #ed8936; }
    
    .summary-card.rate { border-top: 4px solid #9f7aea; }
    .summary-card.rate .summary-card-value { color: #9f7aea; }
    
    .context-row {
      background: #edf2f7 !important;
      font-weight: 700;
    }
    
    .context-name {
      color: #2d3748;
      font-size: 15px;
      padding: 16px 20px !important;
      border-top: 2px solid #cbd5e0;
      border-bottom: 2px solid #cbd5e0;
    }
    
    .subtest-row {
      background: #f7fafc;
    }
    
    .subtest-row:hover {
      background: #edf2f7 !important;
    }
    
    .subtest-name {
      padding-left: 40px !important;
      color: #4a5568;
      font-size: 13px;
    }
    
    .content {
      padding: 30px 40px;
    }
    
    .content h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #2d3748;
    }
    
    .suite {
      margin-bottom: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      transition: box-shadow 0.2s;
    }
    
    .suite:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .suite-header {
      background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
      padding: 18px 24px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
      user-select: none;
    }
    
    .suite-header:hover {
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    }
    
    .suite-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    
    .suite-toggle {
      font-size: 18px;
      transition: transform 0.3s;
      color: #4a5568;
    }
    
    .suite.expanded .suite-toggle {
      transform: rotate(90deg);
    }
    
    .suite-name {
      font-weight: 600;
      font-size: 15px;
      color: #2d3748;
    }
    
    .suite-stats {
      display: flex;
      gap: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .stat-pass { color: #48bb78; }
    .stat-fail { color: #f56565; }
    .stat-skip { color: #ed8936; }
    
    .suite-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }
    
    .suite.expanded .suite-body {
      max-height: 5000px;
      transition: max-height 0.5s ease-in;
    }
    
    .tests-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .tests-table thead {
      background: #f7fafc;
    }
    
    .tests-table th {
      padding: 12px 20px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .tests-table tbody tr {
      border-bottom: 1px solid #f7fafc;
      transition: background 0.15s;
    }
    
    .tests-table tbody tr:hover {
      background: #f7fafc;
    }
    
    .tests-table tbody tr:last-child {
      border-bottom: none;
    }
    
    .tests-table td {
      padding: 14px 20px;
      font-size: 14px;
    }
    
    .test-name {
      color: #2d3748;
      font-weight: 500;
    }
    
    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-pass {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .status-fail {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .status-skip {
      background: #feebc8;
      color: #7c2d12;
    }
    
    .duration {
      color: #718096;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    
    .error-row {
      background: #fff5f5 !important;
    }
    
    .error-message {
      padding: 14px 20px;
      color: #c53030;
      font-size: 13px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-word;
      border-left: 3px solid #fc8181;
      background: #fff5f5;
      margin: 0 20px 14px 20px;
      border-radius: 4px;
    }
    
    .footer {
      background: #2d3748;
      color: white;
      padding: 20px 40px;
      text-align: center;
      font-size: 13px;
      opacity: 0.8;
    }
    
    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    .btn-primary {
      background: #4299e1;
      color: white;
    }
    
    .btn-primary:hover {
      background: #3182ce;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(66, 153, 225, 0.3);
    }
    
    .btn-secondary {
      background: #718096;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #4a5568;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(74, 85, 104, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cypress Test Execution Report</h1>
      <div class="header-meta">
        <div class="header-meta-item">
          <span class="header-meta-label">Started</span>
          <span class="header-meta-value">${data.startTime.toLocaleString()}</span>
        </div>
        <div class="header-meta-item">
          <span class="header-meta-label">Ended</span>
          <span class="header-meta-value">${data.endTime.toLocaleString()}</span>
        </div>
        <div class="header-meta-item">
          <span class="header-meta-label">Duration</span>
          <span class="header-meta-value">${duration}s</span>
        </div>
      </div>
    </div>
    
    <div class="summary">
      <h2>Overall Summary</h2>
      <div class="summary-grid">
        <div class="summary-card total">
          <div class="summary-card-value">${data.totals.suites}</div>
          <div class="summary-card-label">Test Suites</div>
        </div>
        <div class="summary-card total">
          <div class="summary-card-value">${data.totals.tests}</div>
          <div class="summary-card-label">Total Tests</div>
        </div>
        <div class="summary-card passed">
          <div class="summary-card-value">${data.totals.passes}</div>
          <div class="summary-card-label">TOTAL PASS</div>
        </div>
        <div class="summary-card failed">
          <div class="summary-card-value">${data.totals.failures}</div>
          <div class="summary-card-label">TOTAL FAIL</div>
        </div>
        <div class="summary-card skipped">
          <div class="summary-card-value">${data.totals.pending}</div>
          <div class="summary-card-label">TOTAL BLOCK</div>
        </div>
        <div class="summary-card rate">
          <div class="summary-card-value">${successRate}%</div>
          <div class="summary-card-label">Success Rate</div>
        </div>
      </div>
    </div>
    
    <div class="content">
      <h2>Test Suites</h2>
      <div class="controls">
        <button class="btn btn-primary" onclick="expandAll()">▼ Expand All</button>
        <button class="btn btn-secondary" onclick="collapseAll()">▶ Collapse All</button>
      </div>
      <div class="suites">
        ${data.suites.map((suite, index) => this.generateSuiteHTML(suite, index)).join('')}
      </div>
    </div>
    
    <div class="footer">
      Generated on ${new Date().toLocaleString()} | Cypress Custom Reporter
    </div>
  </div>
  
  <script>
    function toggleSuite(index) {
      const suite = document.getElementById('suite-' + index);
      suite.classList.toggle('expanded');
    }
    
    function expandAll() {
      const suites = document.querySelectorAll('.suite');
      suites.forEach(suite => suite.classList.add('expanded'));
    }
    
    function collapseAll() {
      const suites = document.querySelectorAll('.suite');
      suites.forEach(suite => suite.classList.remove('expanded'));
    }
  </script>
</body>
</html>`
    
    return html
  }

  generateSuiteHTML(suite, index) {
    const statusIcon = (status) => {
      switch(status) {
        case 'PASS': return '✓'
        case 'FAIL': return '✗'
        case 'SKIP': return '⊘'
        default: return '?'
      }
    }
    
    // Check if suite has contexts (hierarchical structure)
    const hasContexts = suite.contexts && suite.contexts.length > 0
    
    let bodyHTML = ''
    
    if (hasContexts) {
      // Hierarchical structure: suite > contexts > tests
      bodyHTML = `
        <table class="tests-table">
          <thead>
            <tr>
              <th>Test Case / Sub-Test</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
      `
      
      suite.contexts.forEach(context => {
        // Context row (Test Case)
        bodyHTML += `
            <tr class="context-row">
              <td colspan="3" class="context-name">${this.escapeHtml(context.name)}</td>
            </tr>
        `
        
        // Tests under context (Sub-Test Cases)
        context.tests.forEach(test => {
          const errorHTML = test.status === 'FAIL' && test.error 
            ? `<tr class="error-row"><td colspan="3"><div class="error-message">Error: ${this.escapeHtml(test.error)}</div></td></tr>`
            : ''
          
          bodyHTML += `
            <tr class="subtest-row">
              <td class="test-name subtest-name">↳ ${this.escapeHtml(test.name)}</td>
              <td>
                <span class="status status-${test.status.toLowerCase()}">
                  ${statusIcon(test.status)} ${test.status}
                </span>
              </td>
              <td class="duration">${test.duration ? test.duration + 'ms' : 'N/A'}</td>
            </tr>
            ${errorHTML}
          `
        })
      })
      
      // Direct tests under suite (if any)
      if (suite.tests && suite.tests.length > 0) {
        suite.tests.forEach(test => {
          const errorHTML = test.status === 'FAIL' && test.error 
            ? `<tr class="error-row"><td colspan="3"><div class="error-message">Error: ${this.escapeHtml(test.error)}</div></td></tr>`
            : ''
          
          bodyHTML += `
            <tr>
              <td class="test-name">${this.escapeHtml(test.name)}</td>
              <td>
                <span class="status status-${test.status.toLowerCase()}">
                  ${statusIcon(test.status)} ${test.status}
                </span>
              </td>
              <td class="duration">${test.duration ? test.duration + 'ms' : 'N/A'}</td>
            </tr>
            ${errorHTML}
          `
        })
      }
      
      bodyHTML += `
          </tbody>
        </table>
      `
    } else {
      // Flat structure: suite > tests (no contexts)
      const testsHTML = (suite.tests || []).map(test => {
        const errorHTML = test.status === 'FAIL' && test.error 
          ? `<tr class="error-row"><td colspan="3"><div class="error-message">Error: ${this.escapeHtml(test.error)}</div></td></tr>`
          : ''
        
        return `
          <tr>
            <td class="test-name">${this.escapeHtml(test.name)}</td>
            <td>
              <span class="status status-${test.status.toLowerCase()}">
                ${statusIcon(test.status)} ${test.status}
              </span>
            </td>
            <td class="duration">${test.duration ? test.duration + 'ms' : 'N/A'}</td>
          </tr>
          ${errorHTML}
        `
      }).join('')
      
      bodyHTML = `
        <table class="tests-table">
          <thead>
            <tr>
              <th>Test Case Name</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${testsHTML}
          </tbody>
        </table>
      `
    }
    
    return `
      <div class="suite" id="suite-${index}">
        <div class="suite-header" onclick="toggleSuite(${index})">
          <div class="suite-header-left">
            <span class="suite-toggle">▶</span>
            <span class="suite-name">${this.escapeHtml(suite.name)}</span>
          </div>
          <div class="suite-stats">
            <span class="stat stat-pass">✓ ${suite.stats.passes}</span>
            <span class="stat stat-fail">✗ ${suite.stats.failures}</span>
            <span class="stat stat-skip">⊘ ${suite.stats.pending}</span>
            <span class="stat">Total: ${suite.stats.total}</span>
          </div>
        </div>
        <div class="suite-body">
          ${bodyHTML}
        </div>
      </div>
    `
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  padRight(str, length) {
    return str.length >= length ? str.substring(0, length) : str + ' '.repeat(length - str.length)
  }
}

module.exports = CustomTabularReporter
