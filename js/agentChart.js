function createAgentChart() {
    const container = d3.select('#agentChart');
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

    // Axis labels
    g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Cars Sold');

    g.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('text-anchor', 'middle')
        .text('Average Sales Rating');

    // Axis groups
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`);

    g.append('g')
        .attr('class', 'y-axis');

    updateAgentChart();
}

function updateAgentChart() {
    const agentData = d3.rollup(
        filteredData,
        v => ({
            totalSales: v.length,
            soldCars: v.filter(d => d['Car Sale Status'] === 'Sold').length,
            avgRating: d3.mean(v, d => d['Sales Rating']) || 0,
            totalCommission: d3.sum(v, d => d['Sales Commission-$']) || 0
        }),
        d => d['Sales Agent Name']
    );

    const chartData = Array.from(agentData, ([agent, metrics]) => ({
        agent,
        ...metrics
    })).filter(d => d.totalSales > 0);

    const container = d3.select('#agentChart');
    const margin = { top: 20, right: 30, bottom: 70, left: 80 };
    const containerWidth = container.node().clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 300;

    const svg = container.select('svg').select('g');

    const xScale = d3.scaleLinear()
        .domain(d3.extent(chartData, d => d.avgRating))
        .nice()
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.soldCars)])
        .nice()
        .range([height, 0]);

    const sizeScale = d3.scaleSqrt()
        .domain(d3.extent(chartData, d => d.totalCommission))
        .range([5, 20]);

    // Axes
    svg.select('.x-axis')
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale).ticks(5));

    svg.select('.y-axis')
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale).ticks(6));

    // Bind data
    const circles = svg.selectAll('.agent-circle')
        .data(chartData, d => d.agent);

    // Enter
    circles.enter()
        .append('circle')
        .attr('class', (d, i) => `agent-circle color-${(i % 8) + 1}`)
        .attr('cx', d => xScale(d.avgRating))
        .attr('cy', d => yScale(d.soldCars))
        .attr('r', 0)
        .attr('opacity', 0.75)
        .on('mouseover', (event, d) => {
            showTooltip(event, `
                <strong>${d.agent}</strong><br>
                Total Sales: ${d.totalSales}<br>
                Sold Cars: ${d.soldCars}<br>
                Avg Rating: ${d.avgRating.toFixed(1)}<br>
                Commission: $${d.totalCommission.toLocaleString()}
            `);
        })
        .on('mouseout', hideTooltip)
        .transition()
        .duration(750)
        .attr('r', d => sizeScale(d.totalCommission));

    // Update
    circles.transition()
        .duration(750)
        .attr('cx', d => xScale(d.avgRating))
        .attr('cy', d => yScale(d.soldCars))
        .attr('r', d => sizeScale(d.totalCommission));

    // Exit
    circles.exit()
        .transition()
        .duration(750)
        .attr('r', 0)
        .remove();
}
