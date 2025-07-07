function createTimelineChart() {
    const container = d3.select('#timelineChart');
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

    // Axis groups
    g.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${height})`);
    g.append('g').attr('class', 'y-axis');

    // Axis labels
    g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .style('text-anchor', 'middle')
        .text('Cars Sold');

    g.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('text-anchor', 'middle')
        .text('Sold Date');

    updateTimelineChart();
}

function updateTimelineChart() {
    const soldData = filteredData.filter(d =>
        d['Car Sale Status'] === 'Sold' &&
        d['Sold Date'] !== '1970-01-01' &&
        d['Sold Date'] !== '1/1/1970'
    );

    if (soldData.length === 0) return;

    const parseDate = d3.timeParse('%Y-%m-%d');
    const monthlyData = d3.rollup(
        soldData,
        v => v.length,
        d => {
            const date = parseDate(d['Sold Date']);
            return date ? d3.timeMonth(date) : null;
        }
    );

    const chartData = Array.from(monthlyData, ([date, count]) => ({
        date,
        value: count
    })).filter(d => d.date).sort((a, b) => a.date - b.date);

    if (chartData.length === 0) return;

    const container = d3.select('#timelineChart');
    const margin = { top: 20, right: 30, bottom: 70, left: 80 };
    const containerWidth = container.node().clientWidth;
    const width = containerWidth - margin.left - margin.right;
    const height = 300;

    const svg = container.select('svg').select('g');

    const xScale = d3.scaleTime()
        .domain(d3.extent(chartData, d => d.date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value)])
        .nice()
        .range([height, 0]);

    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    // Axes
    svg.select('.x-axis')
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %Y')))
        .selectAll('text')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.7em')
        .attr('dy', '0.15em')
        .attr('transform', 'rotate(-40)');

    svg.select('.y-axis')
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale));

    // Line
    const path = svg.selectAll('.timeline-line')
        .data([chartData]);

    path.enter()
        .append('path')
        .attr('class', 'timeline-line')
        .attr('fill', 'none')
        .attr('stroke', '#4facfe')  // consistent blue tone
        .attr('stroke-width', 3)
        .attr('d', line)
        .merge(path)
        .transition()
        .duration(750)
        .attr('d', line);

    path.exit().remove();

    // Circles
    const circles = svg.selectAll('.timeline-circle')
        .data(chartData);

    circles.enter()
        .append('circle')
        .attr('class', 'timeline-circle')
        .attr('r', 5)
        .attr('fill', '#4facfe')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .on('mouseover', (event, d) => {
            showTooltip(event, `
                <strong>${d3.timeFormat('%B %Y')(d.date)}</strong><br>
                Cars Sold: ${d.value}
            `);
        })
        .on('mouseout', hideTooltip)
        .merge(circles)
        .transition()
        .duration(750)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value));

    circles.exit().remove();
}
