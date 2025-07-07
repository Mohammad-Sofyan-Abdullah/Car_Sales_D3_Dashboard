function createMarginChart() {
    const container = d3.select('#marginChart');
    container.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 70, left: 80 };
    const containerWidth = container.node().clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 300;

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Axes
    g.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${height})`);
    g.append('g').attr('class', 'y-axis');

    // Axis labels
    g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .style('text-anchor', 'middle')
        .text('Average Margin (%)');

    g.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('text-anchor', 'middle')
        .text('Car Type');

    // Zero line placeholder
    g.append('line')
        .attr('class', 'zero-line')
        .attr('stroke', '#666')
        .attr('stroke-dasharray', '4,2')
        .attr('opacity', 0.6);

    updateMarginChart();
}

function updateMarginChart() {
    const marginData = d3.rollup(
        filteredData.filter(d => d['Car Sale Status'] === 'Sold'),
        v => d3.mean(v, d => d['Margin-%']) || 0,
        d => d['Car Type']
    );

    const chartData = Array.from(marginData, ([carType, avgMargin]) => ({
        carType,
        avgMargin
    })).sort((a, b) => b.avgMargin - a.avgMargin);

    const container = d3.select('#marginChart');
    const margin = { top: 20, right: 30, bottom: 70, left: 80 };
    const containerWidth = container.node().clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 300;

    const svg = container.select('svg').select('g');

    const xScale = d3.scaleBand()
        .domain(chartData.map(d => d.carType))
        .range([0, width])
        .padding(0.1);

    const yExtent = d3.extent(chartData, d => d.avgMargin);
    const yScale = d3.scaleLinear()
        .domain([
            Math.min(yExtent[0], -5),
            Math.max(yExtent[1], 5)
        ])
        .nice()
        .range([height, 0]);

    // Axes
    svg.select('.x-axis')
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-0.6em')
        .attr('dy', '0.15em')
        .attr('transform', 'rotate(-40)');

    svg.select('.y-axis')
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale).tickFormat(d => d + '%'));

    // Zero line
    svg.select('.zero-line')
        .transition()
        .duration(750)
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0));

    // Bars
    const bars = svg.selectAll('.margin-bar')
        .data(chartData, d => d.carType);

    bars.enter()
        .append('rect')
        .attr('class', 'margin-bar')
        .attr('x', d => xScale(d.carType))
        .attr('y', yScale(0))
        .attr('width', xScale.bandwidth())
        .attr('height', 0)
        .attr('fill', d => d.avgMargin >= 0 ? 'var(--profit-color)' : 'var(--loss-color)')
        .attr('class', (d, i) => `margin-bar ${d.avgMargin >= 0 ? 'color-7' : 'color-4'}`)
        .on('mouseover', (event, d) => {
            showTooltip(event, `
                <strong>${d.carType}</strong><br>
                Avg Margin: ${d.avgMargin.toFixed(1)}%<br>
                ${d.avgMargin >= 0 ? 'Profit' : 'Loss'}
            `);
        })
        .on('mouseout', hideTooltip)
        .transition()
        .duration(750)
        .attr('y', d => d.avgMargin >= 0 ? yScale(d.avgMargin) : yScale(0))
        .attr('height', d => Math.abs(yScale(d.avgMargin) - yScale(0)));

    bars.transition()
        .duration(750)
        .attr('x', d => xScale(d.carType))
        .attr('y', d => d.avgMargin >= 0 ? yScale(d.avgMargin) : yScale(0))
        .attr('height', d => Math.abs(yScale(d.avgMargin) - yScale(0)))
        .attr('width', xScale.bandwidth())
        .attr('class', (d, i) => `margin-bar ${d.avgMargin >= 0 ? 'color-7' : 'color-4'}`);

    bars.exit()
        .transition()
        .duration(750)
        .attr('y', yScale(0))
        .attr('height', 0)
        .remove();
}
