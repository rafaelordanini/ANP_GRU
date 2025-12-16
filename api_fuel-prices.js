import * as XLSX from 'xlsx';

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

async function fetchAndProcessExcel() {
    const response = await fetch(EXCEL_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Excel: ${response.status}`);
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
        if (!maxDate || dataFinal > maxDate) {
            maxDate = dataFinal;
        }
    });

    const latestData = guarulhosData.filter(row => {
        const dataFinal = excelDateToJS(row['DATA FINAL']);
        return dataFinal.getTime() === maxDate.getTime();
    });

    let minDate = null;
    latestData.forEach(row => {
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

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const result = await fetchAndProcessExcel();
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
