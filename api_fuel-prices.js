const XLSX = require('xlsx');

const EXCEL_URL = 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/semanal/semanal-municipio-2024-2025.xlsx';
const HEADER_ROW = 11;

function excelDateToJS(serial) {
    if (serial instanceof Date) return serial;
    if (typeof serial === 'string') return new Date(serial);
    const utcDays = Math.floor(serial - 25569);
    return new Date(utcDays * 86400 * 1000);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getSecondsUntil7AM() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(7, 0, 0, 0);
    if (now >= target) {
        target.setDate(target.getDate() + 1);
    }
    const diffMs = target - now;
    const diffSeconds = Math.floor(diffMs / 1000);
    return Math.max(60, Math.min(diffSeconds, 86400));
}

async function fetchAndProcessExcel() {
    const response = await fetch(EXCEL_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Excel: ' + response.status);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: HEADER_ROW,
        defval: null
    });

    const guarulhosData = jsonData.filter(function(row) {
        const municipio = row['MUNICÍPIO'] || row['MUNICIPIO'];
        return municipio && municipio.toString().toUpperCase() === 'GUARULHOS';
    });

    if (guarulhosData.length === 0) {
        throw new Error('Nenhum dado encontrado para Guarulhos');
    }

    let maxDate = null;
    guarulhosData.forEach(function(row) {
        const dataFinal = excelDateToJS(row['DATA FINAL']);
        if (!maxDate || dataFinal > maxDate) {
            maxDate = dataFinal;
        }
    });

    const latestData = guarulhosData.filter(function(row) {
        const dataFinal = excelDateToJS(row['DATA FINAL']);
        return dataFinal.getTime() === maxDate.getTime();
    });

    let minDate = null;
    latestData.forEach(function(row) {
        const dataInicial = excelDateToJS(row['DATA INICIAL']);
        if (!minDate || dataInicial < minDate) {
            minDate = dataInicial;
        }
    });

    const prices = {
        gasolinaComum: null,
        etanol: null,
        diesel: null,
        gnv: null
    };

    latestData.forEach(function(row) {
        const produto = (row['PRODUTO'] || '').toString().toUpperCase();
        const preco = row['PREÇO MÉDIO REVENDA'];

        if (produto.includes('GASOLINA COMUM')) {
            prices.gasolinaComum = preco !== null && !isNaN(preco) ? parseFloat(preco) : null;
        } else if (produto.includes('ETANOL')) {
            prices.etanol = preco !== null && !isNaN(preco) ? parseFloat(preco) : null;
        } else if (produto.includes('DIESEL') && !produto.includes('S10')) {
            prices.diesel = preco !== null && !isNaN(preco) ? parseFloat(preco) : null;
        } else if (produto.includes('GNV')) {
            prices.gnv = preco !== null && !isNaN(preco) ? parseFloat(preco) : null;
        }
    });

    return {
        success: true,
        data: prices,
        periodStart: formatDate(minDate),
        periodEnd: formatDate(maxDate),
        updatedAt: new Date().toISOString()
    };
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const forceRefresh = req.query.refresh === 'true';

    try {
        const result = await fetchAndProcessExcel();
        const cacheSeconds = getSecondsUntil7AM();

        if (!forceRefresh) {
            res.setHeader('Cache-Control', `s-maxage=${cacheSeconds}, stale-while-revalidate=60`);
        } else {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
