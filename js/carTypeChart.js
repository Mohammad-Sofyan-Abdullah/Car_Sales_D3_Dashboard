function createCarTypeChart() {
    const container = d3.select('#carTypeChart');
    container.selectAll('*').remove();

    const width = container.node().clientWidth;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    updateCarTypeChart();
}

function updateCarTypeChart() {
    const data = d3.rollup(
        filteredData,
        v => v.length,
        d => d['Car Type']
    );

    const chartData = Array.from(data, ([type, value]) => ({ type, value }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value);

    const container = d3.select('#carTypeChart');
    const width = container.node().clientWidth;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = container.select('svg').select('g');

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(radius * 0.5)  // donut instead of full pie
        .outerRadius(radius);

    const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    const pieData = pie(chartData);

    // PIE SLICES
    const slices = svg.selectAll('.pie-slice')
        .data(pieData, d => d.data.type);

    slices.enter()
        .append('path')
        .attr('class', (d, i) => `pie-slice color-${(i % 8) + 1}`)
        .attr('d', arc)
        .attr('fill-opacity', 0.95)
        .each(function(d) { this._current = { startAngle: 0, endAngle: 0 }; })
        .on('mouseover', (event, d) => {
            showTooltip(event, `
                <strong>${d.data.type}</strong><br>
                Cars: ${d.data.value}<br>
                Percentage: ${((d.data.value / filteredData.length) * 100).toFixed(1)}%
            `);
        })
        .on('mouseout', hideTooltip)
        .transition()
        .duration(750)
        .attrTween('d', function(d) {
            const i = d3.interpolate(this._current, d);
            this._current = i(1);
            return t => arc(i(t));
        });

    slices.transition()
        .duration(750)
        .attrTween('d', function(d) {
            const i = d3.interpolate(this._current || d, d);
            this._current = i(1);
            return t => arc(i(t));
        });

    slices.exit()
        .transition()
        .duration(750)
        .attrTween('d', function(d) {
            const i = d3.interpolate(d, { startAngle: 0, endAngle: 0 });
            return t => arc(i(t));
        })
        .remove();

    // LABEL POLYLINES
    const polylines = svg.selectAll('.label-line')
        .data(pieData, d => d.data.type);

    polylines.enter()
        .append('polyline')
        .attr('class', 'label-line')
        .attr('stroke', '#666')
        .attr('stroke-width', 1)
        .attr('fill', 'none')
        .transition()
        .duration(750)
        .attr('points', d => {
            const pos = outerArc.centroid(d);
            pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
        });

    polylines.transition()
        .duration(750)
        .attr('points', d => {
            const pos = outerArc.centroid(d);
            pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
        });

    polylines.exit().remove();

    // LABELS
    const labels = svg.selectAll('.pie-label')
        .data(pieData, d => d.data.type);

    labels.enter()
        .append('text')
        .attr('class', 'pie-label')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('text-anchor', d => midAngle(d) < Math.PI ? 'start' : 'end')
        .attr('transform', d => {
            const pos = outerArc.centroid(d);
            pos[0] = radius * (midAngle(d) < Math.PI ? 1.1 : -1.1);
            return `translate(${pos})`;
        })
        .text(d => {
            const percent = (d.data.value / filteredData.length) * 100;
            return percent >= 5 ? d.data.type : '';
        });

    labels.transition()
        .duration(750)
        .attr('transform', d => {
            const pos = outerArc.centroid(d);
            pos[0] = radius * (midAngle(d) < Math.PI ? 1.1 : -1.1);
            return `translate(${pos})`;
        })
        .style('text-anchor', d => midAngle(d) < Math.PI ? 'start' : 'end')
        .text(d => {
            const percent = (d.data.value / filteredData.length) * 100;
            return percent >= 5 ? d.data.type : '';
        });

    labels.exit().remove();

    function midAngle(d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }
}
