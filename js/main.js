// main.js
let globalData = [];
let filteredData = [];

// Color palette
const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', 
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupFilters();
});

// Load and parse CSV data
async function loadData() {
    try {
        const response = await fetch('Dataset/used_car_sales.csv');
        const csvText = await response.text();
        
        // Parse CSV data
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(h => h.trim());
        
        globalData = rows.slice(1).map(row => {
            const values = parseCSVRow(row);
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            
            // Convert data types
            obj['Price-$'] = parseFloat(obj['Price-$']) || 0;
            obj['Sold Price-$'] = parseFloat(obj['Sold Price-$']) || 0;
            obj['Purchased Price-$'] = parseFloat(obj['Purchased Price-$']) || 0;
            obj['Margin-%'] = parseFloat(obj['Margin-%']) || 0;
            obj['Manufactured Year'] = parseInt(obj['Manufactured Year']) || 0;
            obj['Engine Power-HP'] = parseFloat(obj['Engine Power-HP']) || 0;
            obj['Mileage-KM'] = parseFloat(obj['Mileage-KM']) || 0;
            obj['Sales Rating'] = parseInt(obj['Sales Rating']) || 0;
            obj['Sales Commission-$'] = parseFloat(obj['Sales Commission-$']) || 0;
            
            return obj;
        });
        
        filteredData = [...globalData];
        
        // Initialize all components
        populateFilters();
        updateKPIs();
        initializeCharts();
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Parse CSV row handling commas within quotes
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Populate filter options
function populateFilters() {
    // Manufacturer filter
    const manufacturers = [...new Set(globalData.map(d => d['Manufacturer Name']))].sort();
    const manufacturerSelect = document.getElementById('manufacturerFilter');
    manufacturers.forEach(manufacturer => {
        const option = document.createElement('option');
        option.value = manufacturer;
        option.textContent = manufacturer;
        manufacturerSelect.appendChild(option);
    });
    
    // Car type filter
    const carTypes = [...new Set(globalData.map(d => d['Car Type']))].sort();
    const typeSelect = document.getElementById('typeFilter');
    carTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
    
    // Year filter
    const years = globalData.map(d => d['Manufactured Year']).filter(y => y > 0);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const yearFilter = document.getElementById('yearFilter');
    yearFilter.min = minYear;
    yearFilter.max = maxYear;
    yearFilter.value = minYear;
    document.getElementById('yearValue').textContent = minYear + '+';
}

// Setup filter event listeners
function setupFilters() {
    document.getElementById('manufacturerFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('yearFilter').addEventListener('input', function() {
        document.getElementById('yearValue').textContent = this.value + '+';
        applyFilters();
    });
}

// Apply filters
function applyFilters() {
    const manufacturerFilter = document.getElementById('manufacturerFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const yearFilter = parseInt(document.getElementById('yearFilter').value);
    
    filteredData = globalData.filter(d => {
        return (!manufacturerFilter || d['Manufacturer Name'] === manufacturerFilter) &&
               (!statusFilter || d['Car Sale Status'] === statusFilter) &&
               (!typeFilter || d['Car Type'] === typeFilter) &&
               (d['Manufactured Year'] >= yearFilter);
    });
    
    updateKPIs();
    updateCharts();
}

// Update KPIs
function updateKPIs() {
    const totalCars = filteredData.length;
    const soldCars = filteredData.filter(d => d['Car Sale Status'] === 'Sold').length;
    const totalRevenue = filteredData.reduce((sum, d) => sum + d['Sold Price-$'], 0);
    const avgMargin = filteredData.length > 0 ? 
        filteredData.reduce((sum, d) => sum + d['Margin-%'], 0) / filteredData.length : 0;
    
    document.getElementById('totalCars').textContent = totalCars.toLocaleString();
    document.getElementById('soldCars').textContent = soldCars.toLocaleString();
    document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toLocaleString();
    document.getElementById('avgMargin').textContent = avgMargin.toFixed(1) + '%';
}

// Initialize all charts
function initializeCharts() {
    createManufacturerChart();
    createPriceHistogram();
    createTimelineChart();
    createCarTypeChart();
    createAgentChart();
    createMarginChart();
}

// Update all charts
function updateCharts() {
    updateManufacturerChart();
    updatePriceHistogram();
    updateTimelineChart();
    updateCarTypeChart();
    updateAgentChart();
    updateMarginChart();
}

// Utility functions
function formatCurrency(value) {
    return '$' + value.toLocaleString();
}

function formatNumber(value) {
    return value.toLocaleString();
}

function formatPercent(value) {
    return value.toFixed(1) + '%';
}

// Tooltip functions
function showTooltip(event, html) {
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    tooltip.html(html)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .transition()
        .duration(200)
        .style('opacity', 1);
}

function hideTooltip() {
    d3.selectAll('.tooltip').remove();
}