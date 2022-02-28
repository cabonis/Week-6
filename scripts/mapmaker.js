var drawMap = function(container, size, geojson, contentProvider){

    const content = contentProvider();

    var makeHtml = function(params){
        if(params){
            let div = [];
            Object.keys(params).forEach((key, index) => {
                if(index === 0){
                    div.push(`<div><strong>${key}: ${params[key]}</strong></div>`);
                }
                else{
                    div.push(`<div>${key}: ${params[key].toLocaleString("en-US")}</div>`);
                }
            });
            return div.join("");
        }
    }

    const geoPath_generator = d3.geoPath().projection(d3.geoMercator().fitSize([size.viewbox.width - size.margins.right, size.viewbox.height - size.margins.bottom], geojson))

    d3.select(container)
    .style("position", "relative");

    let svg = d3.select(container).append("svg")
        .attr("viewBox", `0, 0, ${size.viewbox.width}, ${size.viewbox.height}`);

    let tooltip = d3.select(container).append("div")
        .attr("class", "tooltip");

    let infoCard = d3.select(container).append("div")
        .attr("class", "infoCard");

    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", d => geoPath_generator(d))
        .attr("fill", d => content.colorMapper(d))
        .on("mouseenter", (m, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(makeHtml(content.tooltipGenerator(d)))
                .style("left", m.offsetX + "px")
                .style("top", m.offsetY + "px");
            infoCard.transition()
                .duration(200)
                .style("opacity", 1);
            infoCard.html(makeHtml(content.infoCardGenerator(d)));
        })
        .on("mouseout", (m, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
            infoCard.transition()
                .duration(200)
                .style("opacity", 0)
        });
}