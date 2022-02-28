const MA_counties = "./data/towns.topojson";
const MA_fips = "./data/ma_fips.csv";

const TOWN = "TOWN";
const CONUTYGROUP = "FIPS_STCO";
const PROPERTIES = "properties";
const POP1980 = "POP1980";
const POP1990 = "POP1990";
const POP2000 = "POP2000";
const POP2010 = "POP2010";

const size = {
    viewbox: {width: 1000, height:800},
    margins: {top: 20, right: 20, bottom: 20, left: 20}
};

Promise.all([
    d3.json(MA_counties),
    d3.csv(MA_fips)
]).then(function(allData){

    const data = allData[0];
    const fips = allData[1];

    const geojson = topojson.feature(data, data.objects.ma);

    /*-------------------------------------------------------*/
    /*---------------------- Part 1  ------------------------*/
    /*-------------------------------------------------------*/
    drawMap("#part1", size, geojson, () => {

        const pop1980 = function(d){
            return {
                "Town": d[PROPERTIES][TOWN],
                "Population": d[PROPERTIES][POP1980]
            };
        }

        const logScale = function(d){
             const scale = d3.scaleLog()
                .domain(d3.extent(geojson.features, (x) => {
                    return pop1980(x)["Population"];
                }));
            return scale(pop1980(d)["Population"]);
        }

        const whiteBlueInterpolator = d3.interpolateRgb("white", "blue");

        return {
            colorMapper: (d) => whiteBlueInterpolator(logScale(d)),
            tooltipGenerator: (d) => pop1980(d),
            infoCardGenerator: (d) => {}
        }
    });

    
    /*-------------------------------------------------------*/
    /*---------------------- Part 2  ------------------------*/
    /*-------------------------------------------------------*/
    drawMap("#part2", size, geojson, () => {
        
        let popChange = function(d){
            let pop2000 = d[PROPERTIES][POP2000]
            let pop2010 = d[PROPERTIES][POP2010]
            return {
                "Town": d[PROPERTIES][TOWN],
                "ΔPop.": pop2010 - pop2000,
                "%Change": Math.round(((pop2010 - pop2000) / pop2000) * 100)
            }
        }
        
        let divergingInterpolator = d3.scaleDiverging([-10, 0, 10], d3.interpolateRdBu);

        return {
            colorMapper: (d) => divergingInterpolator(popChange(d)["%Change"]),
            tooltipGenerator: (d) => popChange(d),
            infoCardGenerator: (d) => {}
        }
    });

    /*-------------------------------------------------------*/
    /*---------------------- Part 3  ------------------------*/
    /*-------------------------------------------------------*/
    drawMap("#part3", size, geojson, () => {

        const pop2010 = function(d){
            return {
                "Town": d[PROPERTIES][TOWN],
                "Population": d[PROPERTIES][POP2010]
            };
        }

        const counties = d3.group(geojson.features, (d) => d[PROPERTIES][CONUTYGROUP]);

        const countiesConsolidated = (function() {
            let countyData = {};     
            counties.forEach((values, key) => {

                reduced = values.reduce((acc, item) => {
                    acc.POP1980 += item[PROPERTIES][POP1980];
                    acc.POP1990 += item[PROPERTIES][POP1990]
                    acc.POP2000 += item[PROPERTIES][POP2000];
                    acc.POP2010 += item[PROPERTIES][POP2010];
                    return acc;
                }, {POP1980:0, POP1990:0, POP2000:0, POP2010:0});

                var county = fips.filter(function(d){
                    return (d.fips.indexOf(key) === 0);
                  });

                countyData[key] = {};
                countyData[key]["County"] = county[0].name;
                countyData[key]["Pop. 1980"] = reduced[POP1980];
                countyData[key]["Pop. 1990"] = reduced[POP1990];
                countyData[key]["Pop. 2000"] = reduced[POP2000];
                countyData[key]["Pop. 2010"] = reduced[POP2010];
            });
            
            return countyData;
        })();

        const colorScale = d3.scaleOrdinal()
            .domain(counties, (c) => c.key)
            .range(["#47ca2d", "#a024f4", "#cf2e24", "#7ab8df", "#dca936", "#9f4f99", "#4c783d", "#e39fa0", "#4764d4", "#42c59d", "#74697a", "#a6b59f", "#c73160", "#c402b7"])

        return {
            colorMapper: (d) => colorScale(d[PROPERTIES][CONUTYGROUP]),
            tooltipGenerator: (d) => pop2010(d),
            infoCardGenerator: (d) => countiesConsolidated[d[PROPERTIES][CONUTYGROUP]]
        }
    });

})