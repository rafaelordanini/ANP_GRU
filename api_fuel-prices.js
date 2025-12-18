const XLSX = require('xlsx');

const ANP_PAGE_URL = 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/serie-historica-do-levantamento-de-precos';
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

async function fetchWithTimeout(url, options = {}, timeout = 25000) {
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

// Find the most recent "Municípios" Excel link from ANP page
async function findLatestExcelUrl() {
    const response = await fetchWithTimeout(ANP_PAGE_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch ANP page: ' + response.status);
    }

    const html = await response.text();

    // Find all links that match "Municípios (YYYY a YYYY)" pattern
    // Looking for links like: semanal-municipio-2024-2025.xlsx
    const municipioPattern = /href="([^"]*semanal-municipio-(\d{4})-(\d{4})\.xlsx)"/gi;
    const matches = [];
    let match;

    while ((match = municipioPattern.exec(html)) !== null) {
        matches.push({
            url: match[1],
            startYear: parseInt(match[2]),
            endYear: parseInt(match[3])
        });
    }

    if (matches.length === 0) {
        // Fallback: try alternative pattern for relative URLs
        const altPattern = /semanal-municipio-(\d{4})-(\d{4})\.xlsx/gi;
        while ((match = altPattern.exec(html)) !== null) {
            matches.push({
                url: `https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/semanal/semanal-municipio-${match[1]}-${match[2]}.xlsx`,
                startYear: parseInt(match[1]),
                endYear: parseInt(match[2])
            });
        }
    }

    if (matches.length === 0) {
        throw new Error('No municipality Excel files found on ANP page');
    }

    // Sort by end year (descending) to get the most recent
    matches.sort((a, b) => b.endYear - a.endYear || b.startYear - a.startYear);

    const latestUrl = matches[0].url;

    // Ensure URL is absolute
    if (latestUrl.startsWith('/')) {
        return 'https://www.gov.br' + latestUrl;
    } else if (!latestUrl.startsWith('http')) {
        return 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/semanal/' + latestUrl;
    }

    return latestUrl;
}

async function fetchAndProcessExcel() {
    // First, find the latest Excel URL dynamically
    console.log('Finding latest Excel URL...');
    const excelUrl = await findLatestExcelUrl();
    console.log('Latest Excel URL:', excelUrl);

    // Fetch the Excel file
    const response = await fetchWithTimeout(excelUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
        }
    }, 30000);

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
        sourceUrl: excelUrl,
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
