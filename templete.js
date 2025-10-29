// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 40, right: 40, bottom: 60, left: 60 },
          width = 600 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Create the SVG container inside the #boxplot div
    const svg = d3.select("#boxplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    const xScale = d3.scaleBand()
        .domain([...new Set(data.map(d => d.AgeGroup))])  // three age groups
        .range([0, width])
        .padding(0.4);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .nice()
        .range([height, 0]);

    // Add scales
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Age Group");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Likes");

    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        return { min, q1, median, q3, max };
    };

    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.AgeGroup);

    quantilesByGroups.forEach((quantiles, AgeGroup) => {
        const x = xScale(AgeGroup);
        const boxWidth = xScale.bandwidth();

       // Draw vertical line (min to max)
        svg.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(quantiles.min))
            .attr("y2", yScale(quantiles.max))
            .attr("stroke", "black");

        // Draw box (q1 to q3)
        svg.append("rect")
            .attr("x", x)
            .attr("y", yScale(quantiles.q3))
            .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
            .attr("width", boxWidth)
            .attr("stroke", "black")
            .attr("fill", "#dceefb");

        // Draw median line
        svg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScale(quantiles.median))
            .attr("y2", yScale(quantiles.median))
            .attr("stroke", "black")
            .attr("stroke-width", 2);
        
    });
});

// Prepare you data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(d => {
        d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 40, right: 150, bottom: 60, left: 60 },
          width = 700 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#barplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // ---- 1️⃣ Define scales ----
    const platforms = [...new Set(data.map(d => d.Platform))];
    const postTypes = [...new Set(data.map(d => d.PostType))];

    // x0 → for platform groups
    const x0 = d3.scaleBand()
        .domain(platforms)
        .range([0, width])
        .padding(0.2);

    // x1 → for post types within each platform
    const x1 = d3.scaleBand()
        .domain(postTypes)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    // y → for AvgLikes
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);
      

    const color = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.PostType))])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
         
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .text("Platform");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Average Likes");


  // Group container for bars
const barGroups = svg.selectAll(".barGroup")
  .data([...new Set(data.map(d => d.Platform))]) // one group per platform
  .enter()
  .append("g")
  .attr("class", "barGroup")
  .attr("transform", d => `translate(${x0(d)},0)`);

// Draw bars
barGroups.selectAll("rect")
  .data(platform => data.filter(d => d.Platform === platform))
  .enter()
  .append("rect")
  .attr("x", d => x1(d.PostType))
  .attr("y", d => y(d.AvgLikes))
  .attr("width", x1.bandwidth())
  .attr("height", d => height - y(d.AvgLikes))
  .attr("fill", d => color(d.PostType));

// Add the legend
const legend = svg.append("g")
  .attr("transform", `translate(${width}, ${margin.top})`);

const types = [...new Set(data.map(d => d.PostType))];

types.forEach((type, i) => {
  // colored box
  legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(type));

  // label text
  legend.append("text")
      .attr("x", 25)
      .attr("y", i * 20 + 12)
      .text(type)
      .attr("alignment-baseline", "middle");
});

});

// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 

const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers
  data.forEach(d => {
    d.AvgLikes = +d.AvgLikes;
  });

  // Define the dimensions and margins for the SVG
  const margin = { top: 40, right: 50, bottom: 60, left: 60 },
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  // Create the SVG container
  const svg = d3.select("#lineplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales for x and y axes  
  const x = d3.scalePoint()
    .domain(data.map(d => d.Date))
    .range([0, width])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.AvgLikes)])
    .nice()
    .range([height, 0]);

  // Draw the axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-25)");

  svg.append("g").call(d3.axisLeft(y));

  // Add x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .attr("text-anchor", "middle")
    .text("Date");

  // Add y-axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text("Average Likes");

  // Draw the line and path
  const line = d3.line()
    .x(d => x(d.Date))
    .y(d => y(d.AvgLikes))
    .curve(d3.curveNatural);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2)
    .attr("d", line);

  // add circles
  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.Date))
    .attr("cy", d => y(d.AvgLikes))
    .attr("r", 4)
    .attr("fill", "#1f77b4");
});

