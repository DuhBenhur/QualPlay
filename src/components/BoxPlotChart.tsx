import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface BoxPlotData {
  category: string;
  values: number[];
  quartiles: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers: number[];
  };
}

interface BoxPlotChartProps {
  data: BoxPlotData[];
  width?: number;
  height?: number;
  title: string;
  yAxisLabel: string;
  color?: string;
}

const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
  data,
  width = 800,
  height = 400,
  title,
  yAxisLabel,
  color = '#3B82F6'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 80, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, innerWidth])
      .padding(0.3);

    const allValues = data.flatMap(d => [d.quartiles.min, d.quartiles.max, ...d.quartiles.outliers]);
    const yScale = d3.scaleLinear()
      .domain(d3.extent(allValues) as [number, number])
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    if (title) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .text(title);
    }

    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 20)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#9CA3AF')
      .text(yAxisLabel);

    // X-axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', '#9CA3AF')
      .style('font-size', '12px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Y-axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', '#9CA3AF')
      .style('font-size', '12px');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#374151')
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.7);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('background', '#1F2937')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('border', '1px solid #374151')
      .style('font-size', '12px')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
      .style('backdrop-filter', 'blur(8px)');

    // Box plots
    data.forEach((d, i) => {
      const x = xScale(d.category)!;
      const boxWidth = xScale.bandwidth();
      const { min, q1, median, q3, max, outliers } = d.quartiles;

      // Create group for this box plot
      const boxGroup = g.append('g')
        .attr('class', 'box-plot')
        .style('cursor', 'pointer');

      // Vertical line (min to max, excluding outliers)
      boxGroup.append('line')
        .attr('x1', x + boxWidth / 2)
        .attr('x2', x + boxWidth / 2)
        .attr('y1', yScale(min))
        .attr('y2', yScale(max))
        .style('stroke', color)
        .style('stroke-width', 2)
        .style('opacity', 0)
        .transition()
        .duration(800)
        .delay(i * 100)
        .style('opacity', 1);

      // Box (Q1 to Q3)
      boxGroup.append('rect')
        .attr('x', x + boxWidth * 0.1)
        .attr('y', yScale(q3))
        .attr('width', boxWidth * 0.8)
        .attr('height', 0)
        .style('fill', color)
        .style('fill-opacity', 0.3)
        .style('stroke', color)
        .style('stroke-width', 2)
        .style('rx', 4)
        .transition()
        .duration(800)
        .delay(i * 100)
        .attr('height', yScale(q1) - yScale(q3));

      // Median line
      boxGroup.append('line')
        .attr('x1', x + boxWidth * 0.1)
        .attr('x2', x + boxWidth * 0.9)
        .attr('y1', yScale(median))
        .attr('y2', yScale(median))
        .style('stroke', 'white')
        .style('stroke-width', 3)
        .style('opacity', 0)
        .transition()
        .duration(800)
        .delay(i * 100 + 200)
        .style('opacity', 1);

      // Min and Max lines (whiskers)
      [min, max].forEach((value, index) => {
        boxGroup.append('line')
          .attr('x1', x + boxWidth * 0.3)
          .attr('x2', x + boxWidth * 0.7)
          .attr('y1', yScale(value))
          .attr('y2', yScale(value))
          .style('stroke', color)
          .style('stroke-width', 2)
          .style('opacity', 0)
          .transition()
          .duration(600)
          .delay(i * 100 + index * 100)
          .style('opacity', 1);
      });

      // Outliers
      outliers.forEach((outlier, outlierIndex) => {
        boxGroup.append('circle')
          .attr('cx', x + boxWidth / 2)
          .attr('cy', yScale(outlier))
          .attr('r', 0)
          .style('fill', '#EF4444')
          .style('stroke', '#DC2626')
          .style('stroke-width', 2)
          .style('opacity', 0.8)
          .transition()
          .duration(400)
          .delay(i * 100 + 400 + outlierIndex * 50)
          .attr('r', 4);
      });

      // Invisible overlay for hover
      boxGroup.append('rect')
        .attr('x', x)
        .attr('y', 0)
        .attr('width', boxWidth)
        .attr('height', innerHeight)
        .style('fill', 'transparent')
        .on('mouseover', (event) => {
          // Highlight effect
          boxGroup.selectAll('rect')
            .filter(function() { return d3.select(this).style('fill') !== 'transparent'; })
            .transition()
            .duration(200)
            .style('fill-opacity', 0.5);
          
          boxGroup.selectAll('line')
            .transition()
            .duration(200)
            .style('stroke-width', 3);

          // Show tooltip
          tooltip.transition().duration(200).style('opacity', 1);
          tooltip.html(`
            <div style="font-weight: bold; margin-bottom: 8px; color: #60A5FA;">${d.category}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div>Min:</div><div style="color: #93C5FD;">${min.toFixed(1)}</div>
              <div>Q1:</div><div style="color: #34D399;">${q1.toFixed(1)}</div>
              <div>Mediana:</div><div style="color: #FBBF24;">${median.toFixed(1)}</div>
              <div>Q3:</div><div style="color: #F87171;">${q3.toFixed(1)}</div>
              <div>Max:</div><div style="color: #A78BFA;">${max.toFixed(1)}</div>
              <div>Outliers:</div><div style="color: #EF4444;">${outliers.length}</div>
            </div>
            <div style="margin-top: 8px; font-size: 11px; color: #9CA3AF;">
              IQR: ${(q3 - q1).toFixed(1)} | Amplitude: ${(max - min).toFixed(1)}
            </div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', () => {
          // Remove highlight
          boxGroup.selectAll('rect')
            .filter(function() { return d3.select(this).style('fill') !== 'transparent'; })
            .transition()
            .duration(200)
            .style('fill-opacity', 0.3);
          
          boxGroup.selectAll('line')
            .transition()
            .duration(200)
            .style('stroke-width', 2);

          // Hide tooltip
          tooltip.transition().duration(200).style('opacity', 0);
        });
    });

    // Cleanup function
    return () => {
      d3.select('body').selectAll('div').filter(function() {
        return d3.select(this).style('position') === 'absolute' && 
               d3.select(this).style('background-color') === 'rgb(31, 41, 55)';
      }).remove();
    };

  }, [data, width, height, title, yAxisLabel, color]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: 'transparent' }}
        className="drop-shadow-lg"
      />
    </div>
  );
};

export default BoxPlotChart;