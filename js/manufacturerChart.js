function createManufacturerChart() {
    const container = d3.select('#manufacturerChart');
    container.selectAll('*').remove(); // Clear previous render

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
        .attr('y', -60)
        .attr('x', -height / 2)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Number of Cars');

    g.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('text-anchor', 'middle')
        .text('Manufacturer');

    // Axis groups
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`);

    g.append('g')
        .attr('class', 'y-axis');

    updateManufacturerChart();
}

function updateManufacturerChart() {
    const data = d3.rollup(
        filteredData,
        v => v.length,
        d => d['Manufacturer Name']
    );

    const chartData = Array.from(data, ([manufacturer, count]) => ({ manufacturer, count }))
        .sort((a, b) => b.count - a.count);

    const container = d3.select('#manufacturerChart');
    const margin = { top: 20, right: 30, bottom: 70, left: 80 };
    const containerWidth = container.node().clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 300;

    const svg = container.select('svg').select('g');

    const xScale = d3.scaleBand()
        .domain(chartData.map(d => d.manufacturer))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.count)])
        .nice()
        .range([height, 0]);

    // Axes
    svg.select('.x-axis')
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.7em')
        .attr('dy', '0.15em')
        .attr('transform', 'rotate(-40)');

    svg.select('.y-axis')
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale));

    // Bind data
    const bars = svg.selectAll('.bar')
        .data(chartData, d => d.manufacturer);

    // Enter
    bars.enter()
        .append('rect')
        .attr('class', (d, i) => `bar color-${(i % 8) + 1}`)
        .attr('x', d => xScale(d.manufacturer))
        .attr('y', height)
        .attr('width', xScale.bandwidth())
        .attr('height', 0)
        .on('mouseover', (event, d) => {
            showTooltip(event, `
                <strong>${d.manufacturer}</strong><br>
                Cars: ${d.count}<br>
                Percentage: ${((d.count / filteredData.length) * 100).toFixed(1)}%
            `);
        })
        .on('mouseout', hideTooltip)
        .transition()
        .duration(750)
        .attr('y', d => yScale(d.count))
        .attr('height', d => height - yScale(d.count));

    // Update
    bars.transition()
        .duration(750)
        .attr('x', d => xScale(d.manufacturer))
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.count))
        .attr('class', (d, i) => `bar color-${(i % 8) + 1}`);

    // Exit
    bars.exit()
        .transition()
        .duration(750)
        .attr('y', height)
        .attr('height', 0)
        .remove();
}
