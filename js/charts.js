/**
 * charts.js – Chart.js Analytics Dashboard for WWD App
 */

const ChartsModule = (() => {

  const charts = {};

  function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  }

  function renderAll(incidents, clusters) {
    renderSeverityPie(incidents);
    renderMunicipalityBar(incidents);
    renderMonthlyTrend(incidents);
    renderRampTypeDonut(incidents);
    renderTopRiskBar(clusters);
  }

  // 1. Severity Distribution (Pie)
  function renderSeverityPie(incidents) {
    const ctx = document.getElementById('chart-severity');
    if (!ctx) return;
    destroyChart('severity');

    const counts = { Fatal: 0, Injury: 0, PDO: 0, 'Near-Miss': 0 };
    incidents.forEach(i => { counts[i.severity] = (counts[i.severity] || 0) + 1; });

    charts['severity'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#FF4757','#FFA502','#FFDD59','#7BED9F'],
          borderColor: '#1a1f35',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#c5cde3', font: { family: 'Inter', size: 11 }, padding: 12 } },
          title: { display: true, text: 'Severity Distribution', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        cutout: '62%'
      }
    });
  }

  // 2. Incidents by Municipality (Horizontal Bar)
  function renderMunicipalityBar(incidents) {
    const ctx = document.getElementById('chart-municipality');
    if (!ctx) return;
    destroyChart('municipality');

    const counts = {};
    incidents.forEach(i => { counts[i.municipality] = (counts[i.municipality] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10);

    charts['municipality'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(e => e[0]),
        datasets: [{
          label: 'Incidents',
          data: sorted.map(e => e[1]),
          backgroundColor: sorted.map((_, i) =>
            `hsl(${220 + i * 8}, 70%, ${65 - i * 3}%)`),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Incidents by Jurisdiction (Top 10)', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        scales: {
          x: { ticks: { color: '#8a93b0', font: { family: 'Inter' } }, grid: { color: '#2a3050' } },
          y: { ticks: { color: '#c5cde3', font: { family: 'Inter', size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  // 3. Monthly Trend (Line)
  function renderMonthlyTrend(incidents) {
    const ctx = document.getElementById('chart-trend');
    if (!ctx) return;
    destroyChart('trend');

    const monthly = {};
    incidents.forEach(i => {
      const key = i.dateTime?.slice(0,7); // YYYY-MM
      if (key) monthly[key] = (monthly[key] || 0) + 1;
    });
    const keys = Object.keys(monthly).sort();

    const fatalMonthly = {};
    incidents.filter(i => i.severity === 'Fatal').forEach(i => {
      const key = i.dateTime?.slice(0,7);
      if (key) fatalMonthly[key] = (fatalMonthly[key] || 0) + 1;
    });

    charts['trend'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: keys.map(k => {
          const [y, m] = k.split('-');
          return new Date(y, m-1).toLocaleString('en-US', { month:'short', year:'2-digit' });
        }),
        datasets: [
          {
            label: 'Total Incidents',
            data: keys.map(k => monthly[k] || 0),
            borderColor: '#5352ED',
            backgroundColor: 'rgba(83,82,237,0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#5352ED'
          },
          {
            label: 'Fatal Only',
            data: keys.map(k => fatalMonthly[k] || 0),
            borderColor: '#FF4757',
            backgroundColor: 'rgba(255,71,87,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#FF4757',
            borderDash: [4,3]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#c5cde3', font: { family: 'Inter' } } },
          title: { display: true, text: 'Monthly Incident Trend', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        scales: {
          x: { ticks: { color: '#8a93b0', font:{family:'Inter'} }, grid: { color: '#2a3050' } },
          y: { ticks: { color: '#8a93b0', font:{family:'Inter'} }, grid: { color: '#2a3050' }, beginAtZero: true }
        }
      }
    });
  }

  // 4. Ramp Type Breakdown (Donut)
  function renderRampTypeDonut(incidents) {
    const ctx = document.getElementById('chart-ramp');
    if (!ctx) return;
    destroyChart('ramp');

    const counts = {};
    incidents.forEach(i => { counts[i.rampType] = (counts[i.rampType] || 0) + 1; });
    const labels = Object.keys(counts);

    charts['ramp'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: labels.map(l => counts[l]),
          backgroundColor: ['#FF6B6B','#FFA502','#5352ED','#2ED573'],
          borderColor: '#1a1f35',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#c5cde3', font: { family: 'Inter', size: 11 }, padding: 10 } },
          title: { display: true, text: 'Ramp Type Breakdown', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        cutout: '60%'
      }
    });
  }

  // 5. Top 10 High-Risk Locations (Bar)
  function renderTopRiskBar(clusters) {
    const ctx = document.getElementById('chart-risk-locations');
    if (!ctx) return;
    destroyChart('risk-locations');

    const top = clusters.slice(0, 10);

    charts['risk-locations'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top.map(c => c.road || c.routeNumber || 'Unknown'),
        datasets: [{
          label: 'Risk Score',
          data: top.map(c => c.riskScore),
          backgroundColor: top.map(c => {
            if (c.riskScore >= 75) return 'rgba(255,71,87,0.85)';
            if (c.riskScore >= 50) return 'rgba(255,165,2,0.85)';
            if (c.riskScore >= 25) return 'rgba(255,221,89,0.85)';
            return 'rgba(123,237,159,0.85)';
          }),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Top High-Risk Locations (Risk Score)', color: '#e8ecf5', font: { size: 14, family: 'Inter', weight: 600 }, padding: { bottom: 12 } }
        },
        scales: {
          x: { ticks: { color: '#8a93b0', font:{ family:'Inter', size:10 }, maxRotation: 45 }, grid: { color: '#2a3050' } },
          y: { min: 0, max: 100, ticks: { color: '#8a93b0', font:{family:'Inter'} }, grid: { color: '#2a3050' } }
        }
      }
    });
  }

  return { renderAll };
})();
