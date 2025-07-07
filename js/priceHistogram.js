function createPriceHistogram() {
    const container = d3.select('#priceHistogram');
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

    // Axis Labels
    g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .style('text-anchor', 'middle')
        .text('Frequency');

    g.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('text-anchor', 'middle')
        .text('Price ($)');

    g.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${height})`);
    g.append('g').attr('class', 'y-axis');

    updatePriceHistogram();
}

function updatePriceHistogram() {
    const prices = filteredData.map(d => d['Price-$']).filter(p => p > 0);
    if (prices.length === 0) return;

    const container = d3.select('#priceHistogram');
    const margin = { top: 20, right: 30, bottom: 70, left: 80 };
    const containerWidth = container.node().clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 300;

    const svg = container.select('svg').select('g');

    const xScale = d3.scaleLinear()
        .domain(d3.extent(prices))
        .nice()
        .range([0, width]);

    const histogram = d3.histogram()
        .domain(xScale.domain())
        .thresholds(xScale.ticks(10));

    const bins = histogram(prices);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .nice()
        .range([height, 0]);

    // Update Axes
    svg.select('.x-axis')
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale).tickFormat(d => '$' + d.toLocaleString()));

    svg.select('.y-axis')
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale));

    // Bind data to bars
    const bars = svg.selectAll('.histogram-bar')
        .data(bins);

    // Enter
    bars.enter()
        .append('rect')
        .attr('class', 'histogram-bar color-3')
        .attr('x', d => xScale(d.x0))
        .attr('y', height)
        .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
        .attr('height', 0)
        .attr('rx', 2)
        .on('mouseover', function (event, d) {
            showTooltip(event, `
                <strong>Price Range</strong><br>
                $${d.x0.toLocaleString()} - $${d.x1.toLocaleString()}<br>
                Cars: ${d.length}<br>
                Percentage: ${((d.length / prices.length) * 100).toFixed(1)}%
            `);
        })
        .on('mouseout', hideTooltip)
        .transition()
        .duration(750)
        .attr('y', d => yScale(d.length))
        .attr('height', d => height - yScale(d.length));

    // Update
    bars.transition()
        .duration(750)
        .attr('x', d => xScale(d.x0))
        .attr('y', d => yScale(d.length))
        .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
        .attr('height', d => height - yScale(d.length));

    // Exit
    bars.exit()
        .transition()
        .duration(750)
        .attr('y', height)
        .attr('height', 0)
        .remove();
}
