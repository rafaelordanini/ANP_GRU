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
    return Math.max(60, Math.floor((target - now) / 1000));
}

async function fetchWithTimeout(url, options = {}, timeout = 55000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

async function fetchAndProcessExcel() {
    const response = await fetchWithTimeout(EXCEL_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Excel: ' + response.status);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: HEADER_ROW, defval: null });

    const guarulhosData = jsonData.filter(row => {
        const municipio = row['MUNICÍPIO'] || row['MUNICIPIO'];
        return municipio && municipio.toString().toUpperCase() === 'GUARULHOS';
    });

    if (guarulhosData.length === 0) {
        throw new Error('Nenhum dado encontrado para Guarulhos');
    }

    let maxDate = null;
    guarulhosData.forEach(row => {
        const dataFinal = excelDateToJS(row['DATA FINAL']);
        if (!maxDate || dataFinal > maxDate) maxDate = dataFinal;
    });

    const latestData = guarulhosData.filter(row => {
        return excelDateToJS(row['DATA FINAL']).getTime() === maxDate.getTime();
    });

    let minDate = null;
    latestData.forEach(row => {
        const dataInicial = excelDateToJS(row['DATA INICIAL']);
        if (!minDate || dataInicial < minDate) minDate = dataInicial;
    });

    const prices = { gasolinaComum: null, etanol: null, diesel: null, gnv: null };

    latestData.forEach(row => {
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
            res.setHeader('Cache-Control', `s-maxage=${cacheSeconds}, stale-while-revalidate=300`);
        } else {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('API Error:', error.message);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
