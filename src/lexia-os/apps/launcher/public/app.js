const btnInspectCase = document.getElementById('btn-inspect-case');
const btnInspectInbox = document.getElementById('btn-inspect-inbox');
const screens = document.querySelectorAll('.screen');
const terminalLog = document.getElementById('terminal-log');
const resultsContent = document.getElementById('results-content');
const loadingTitle = document.getElementById('loading-title');

function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function resetUI() {
  showScreen('welcome-screen');
}

function appendLog(html) {
  const p = document.createElement('p');
  p.innerHTML = html;
  terminalLog.appendChild(p);
  terminalLog.scrollTop = terminalLog.scrollHeight;
}

// Simulated step-by-step UI updates
async function simulateSteps(steps) {
  terminalLog.innerHTML = '';
  for (const step of steps) {
    appendLog(`<span class="step">${step.msg}</span>`);
    await new Promise(r => setTimeout(r, step.delay || 600));
  }
}

btnInspectCase.addEventListener('click', async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const testFolder = urlParams.get('test');
    let selData = {};
    
    if (testFolder) {
      selData.path = 'C:\\Users\\urbas\\Documents\\Antigravity\\LexIA\\test\\data\\' + testFolder;
    } else {
      const selRes = await fetch('http://localhost:3000/api/select-folder');
      selData = await selRes.json();
    }
    
    if (!selData.path) return;

    showScreen('loading-screen');
    loadingTitle.textContent = 'Analizando Expediente...';

    // UI Simulation to give the user confidence
    await simulateSteps([
      { msg: 'Abriendo carpeta de expediente...', delay: 500 },
      { msg: 'Buscando 000IndiceElectronico.xlsm...', delay: 800 },
      { msg: 'Leyendo radicados y procesado...', delay: 700 },
      { msg: 'Verificando carpeta de Conocimiento...', delay: 500 },
      { msg: 'Cruzando documentos físicos vs. índice...', delay: 900 }
    ]);

    // 2. Call API
    const apiRes = await fetch('http://localhost:3000/api/inspect-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: selData.path })
    });
    const result = await apiRes.json();
    window.currentResult = result;

    if (result.error) {
      appendLog(`<span class="error">Error: ${result.error}</span>`);
      return;
    }

    appendLog(`<span class="success">Análisis completado. Generando reporte...</span>`);
    await new Promise(r => setTimeout(r, 800));

    // 3. Render Results
    renderCaseResult(result);
    showScreen('results-screen');

  } catch (err) {
    console.error(err);
    alert('Ocurrió un error de conexión');
    resetUI();
  }
});

btnInspectInbox.addEventListener('click', async () => {
  try {
    const selRes = await fetch('http://localhost:3000/api/select-folder');
    const selData = await selRes.json();
    if (!selData.path) return;

    showScreen('loading-screen');
    loadingTitle.textContent = 'Analizando Bandeja JUAN DAVID...';

    await simulateSteps([
      { msg: 'Escaneando archivos en la bandeja...', delay: 600 },
      { msg: 'Clasificando documentos...', delay: 1000 }
    ]);

    const apiRes = await fetch('http://localhost:3000/api/inspect-inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: selData.path })
    });
    const result = await apiRes.json();

    if (result.error) {
      appendLog(`<span class="error">Error: ${result.error}</span>`);
      return;
    }

    renderInboxResult(result);
    showScreen('results-screen');

  } catch (err) {
    console.error(err);
    alert('Ocurrió un error de conexión');
    resetUI();
  }
});

document.getElementById('btn-glosador').addEventListener('click', async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let inboxPath = urlParams.get('inbox');
    let casesPath = urlParams.get('cases');

    if (!inboxPath || !casesPath) {
      appendLog('<span class="step">Selecciona la BANDEJA de entrada...</span>');
      const selRes = await fetch('http://localhost:3000/api/select-folder');
      inboxPath = (await selRes.json()).path;
      if (!inboxPath) return;

      appendLog('<span class="step">Selecciona la CARPETA RAÍZ de Expedientes...</span>');
      const selRes2 = await fetch('http://localhost:3000/api/select-folder');
      casesPath = (await selRes2.json()).path;
      if (!casesPath) return;
    }

    showScreen('loading-screen');
    loadingTitle.textContent = 'Simulando Glosado...';

    await simulateSteps([
      { msg: 'Construyendo índice maestro en memoria...', delay: 800 },
      { msg: 'Leyendo Bandeja de Entrada...', delay: 600 },
      { msg: 'Ejecutando cruce heurístico...', delay: 900 }
    ]);

    const apiRes = await fetch('http://localhost:3000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inboxPath, casesRootPath: casesPath })
    });
    const results = await apiRes.json();

    if (results.error) {
      appendLog(`<span class="error">Error: ${results.error}</span>`);
      return;
    }

    window.currentSimulationResults = results;
    renderSimulationResults(results);
    showScreen('results-screen');

  } catch (err) {
    console.error(err);
    alert('Ocurrió un error de simulación');
    resetUI();
  }
});

function renderCaseResult(res) {
  const isHealthy = res.healthScore === 100;
  
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">
      <h2>Expediente Inspeccionado</h2>
      <h1 style="margin:0">${res.healthStatus} ${res.healthScore}/100</h1>
    </div>

    <div class="results-grid">
      <div class="card">
        <h3>Información Jurídica</h3>
        <div class="data-row"><span class="data-label">Radicado</span><span class="data-value">${res.radicado}</span></div>
        <div class="data-row"><span class="data-label">Procesado</span><span class="data-value">${res.procesado}</span></div>
        <div class="data-row"><span class="data-label">Juzgado</span><span class="data-value">${res.juzgado}</span></div>
      </div>

      <div class="card">
        <h3>Archivos y Numeración</h3>
        <div class="data-row"><span class="data-label">PDFs en Carpeta</span><span class="data-value">${res.stats.pdfCount}</span></div>
        <div class="data-row"><span class="data-label">Documentos en Excel</span><span class="data-value">${res.excelDocsCount}</span></div>
        <div class="data-row"><span class="data-label">Último Excel</span><span class="data-value">${res.lastExcelNumber.toString().padStart(3, '0')}</span></div>
        <div class="data-row"><span class="data-label">Último Carpeta</span><span class="data-value">${res.lastPhysicalNumber.toString().padStart(3, '0')}</span></div>
      </div>
  `;

  if (res.findings.risks.length > 0) {
    html += `
      <div class="card danger">
        <h3 style="color:var(--danger)">🔴 Riesgos Críticos</h3>
        <ul>${res.findings.risks.map(r => `<li>${r}</li>`).join('')}</ul>
        <p style="color:var(--text-muted); margin-top:10px;"><strong>Acción sugerida:</strong> Revisión manual obligatoria. No automatizar este expediente.</p>
      </div>
    `;
  } else if (!isHealthy) {
    html += `
      <div class="card warning">
        <h3 style="color:var(--warning)">⚠️ Hallazgos</h3>
        <ul>${res.findings.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
      </div>
    `;
  } else {
    html += `
      <div class="card">
        <h3 style="color:var(--accent)">🟢 Resultado</h3>
        <p>Todo cuadra perfectamente. El expediente está sano y puede automatizarse con confianza.</p>
      </div>
    `;
  }

  html += `</div>`;
  resultsContent.innerHTML = html;

  if (res.evidence && res.evidence.length > 0) {
    document.getElementById('btn-evidence').style.display = 'inline-block';
  } else {
    document.getElementById('btn-evidence').style.display = 'none';
  }
  document.getElementById('btn-export').style.display = 'inline-block';
}

document.getElementById('btn-evidence').addEventListener('click', () => {
  const res = window.currentResult;
  if (!res || !res.evidence) return;
  let html = '<ul>';
  for (const ev of res.evidence) {
    html += `<li style="margin-bottom: 15px;">
      <strong>${ev.field}</strong>: ${ev.value}<br>
      <span style="color:var(--text-muted); font-size:13px;">↳ Encontrado en <strong>${ev.source}</strong> (${ev.location})</span>
    </li>`;
  }
  html += '</ul>';
  document.getElementById('evidence-content').innerHTML = html;
  document.getElementById('evidence-modal').style.display = 'flex';
});

document.getElementById('btn-export').addEventListener('click', () => {
  const res = window.currentResult;
  if (!res) return;
  const jsonStr = JSON.stringify(res, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Diagnostico_LexIA_${res.radicado || 'Error'}.json`;
  a.click();
});

function renderInboxResult(res) {
  let html = `
    <h2>Bandeja de Entrada inspeccionada</h2>
    <div class="results-grid">
      <div class="card">
        <h3>Total PDFs Encontrados: ${res.total}</h3>
        <div class="data-row"><span class="data-label">Probable Fiscalía</span><span class="data-value">${res.fiscalia}</span></div>
        <div class="data-row"><span class="data-label">Probable Defensa</span><span class="data-value">${res.defensa}</span></div>
        <div class="data-row"><span class="data-label">Probable Despachos</span><span class="data-value">${res.despachos}</span></div>
        <div class="data-row"><span class="data-label">Desconocidos</span><span class="data-value">${res.desconocidos}</span></div>
      </div>
    </div>
  `;
  resultsContent.innerHTML = html;
}

function renderSimulationResults(results) {
  document.getElementById('btn-evidence').style.display = 'none';
  document.getElementById('btn-export').style.display = 'none';

  let html = `<h2>Resultados de Simulación de Glosado</h2><div class="simulation-list" style="display:flex; flex-direction:column; gap:15px;">`;

  if (results.length === 0) {
    html += `<p>No se encontraron PDFs en la bandeja.</p>`;
  }

  results.forEach((res, i) => {
    const m = res.bestMatch;
    html += `<div class="card" style="border-left: 4px solid ${m && m.action === 'Mover' ? 'var(--accent)' : 'var(--warning)'};">
      <h3 style="margin-top:0;">📄 ${res.pdfName}</h3>
    `;

    if (m) {
      const confColors = (score) => score > 80 ? 'color:var(--accent)' : (score > 50 ? 'color:var(--warning)' : 'color:var(--danger)');
      
      html += `
        <div style="background:#111; padding:10px; border-radius:5px; margin-bottom:10px;">
          <p style="margin:0 0 5px 0;"><strong>Destino:</strong> ${m.radicado} (${m.procesado})</p>
          <p style="margin:0 0 5px 0;"><strong>Propuesta:</strong> ${m.proposedName} -> ${m.proposedDestination}</p>
          <p style="margin:0;"><strong>Confianza Global:</strong> <span style="${confColors(m.globalConfidence)}">${m.globalConfidence}%</span></p>
        </div>
        
        <details style="margin-bottom:10px; cursor:pointer; color:var(--text-muted); font-size:14px;">
          <summary>Ver desglose de confianza y evidencia (XAI)</summary>
          <ul style="margin-top:10px; list-style:none; padding:0;">
            <li>Radicado: <span style="${confColors(m.confidenceScores.radicado)}">${m.confidenceScores.radicado}%</span></li>
            <li>Procesado: <span style="${confColors(m.confidenceScores.procesado)}">${m.confidenceScores.procesado}%</span></li>
            <li>Juzgado: <span style="${confColors(m.confidenceScores.juzgado)}">${m.confidenceScores.juzgado}%</span></li>
            <li>Portada simulada: <span style="${confColors(m.confidenceScores.portada)}">${m.confidenceScores.portada}%</span></li>
            <li>Nombre PDF: <span style="${confColors(m.confidenceScores.nombrePDF)}">${m.confidenceScores.nombrePDF}%</span></li>
          </ul>
          <h4 style="margin:10px 0 5px 0;">Evidencia Encontrada:</h4>
          <ul style="margin:0; padding-left:20px;">
            ${m.evidence.map(e => `<li><strong>${e.field}</strong>: ${e.value} <br/><span style="font-size:12px; opacity:0.7">${e.location}</span></li>`).join('')}
          </ul>
        </details>
      `;

      if (res.alternatives && res.alternatives.length > 0) {
        html += `<details style="margin-bottom:10px; cursor:pointer; color:var(--text-muted); font-size:14px;">
          <summary>Ver posibles alternativas (${res.alternatives.length})</summary>
          <ul style="margin-top:10px;">
            ${res.alternatives.map(alt => `<li>${alt.radicado} - ${alt.globalConfidence}%</li>`).join('')}
          </ul>
        </details>`;
      }
      
      html += `
        <div style="display:flex; gap:10px; margin-top:15px;" id="actions-${i}">
          <button class="primary-btn" onclick="submitAudit('${res.pdfName}', 'Correcta', ${i})" style="flex:1; background:var(--accent);">✓ Marcar como Correcta</button>
          <button class="primary-btn" onclick="submitAudit('${res.pdfName}', 'Incorrecta', ${i})" style="flex:1; background:var(--danger); border-color:var(--danger);">✗ Marcar como Incorrecta</button>
        </div>
        <p id="audit-msg-${i}" style="display:none; color:var(--accent); font-weight:bold; margin-top:10px; text-align:center;">✓ Registrado en auditoría.</p>
      `;
    } else {
      html += `
        <p style="color:var(--danger);">No se encontró ningún expediente coincidente.</p>
        <button class="primary-btn" onclick="submitAudit('${res.pdfName}', 'Incorrecta', ${i})" style="background:var(--danger); border-color:var(--danger);">✗ Marcar como Incorrecta</button>
        <p id="audit-msg-${i}" style="display:none; color:var(--accent); font-weight:bold; margin-top:10px; text-align:center;">✓ Registrado en auditoría.</p>
      `;
    }
    html += `</div>`;
  });

  html += `</div>`;
  resultsContent.innerHTML = html;
}

window.submitAudit = async function(pdfName, decision, idx) {
  const result = window.currentSimulationResults[idx];
  try {
    await fetch('http://localhost:3000/api/audit-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfName,
        decision,
        match: result.bestMatch,
        alternatives: result.alternatives
      })
    });
    const actionsDiv = document.getElementById(`actions-${idx}`);
    if (actionsDiv) actionsDiv.style.display = 'none';
    document.getElementById(`audit-msg-${idx}`).style.display = 'block';
  } catch(e) {
    console.error(e);
    alert('Error al guardar auditoría');
  }
};

