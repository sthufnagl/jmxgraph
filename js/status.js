
$(function() {

var context = cubism.context()
	.serverDelay(0)
    .clientDelay(0)
    .step(1000)     // Distance between data points in milliseconds =>2 min
    .size(297);		// Number of data points
 
 
var jolokia = context.jolokia({url:"https://localhost:9443/jolokia", fetchInterval: 1000});

var memory = jolokia.metric(
    function (resp1, resp2) {
        return Number(resp1.value) / Number(resp2.value);
    },
    {type:"read", mbean:"java.lang:type=Memory", attribute:"HeapMemoryUsage", path:"used"},
    {type:"read", mbean:"java.lang:type=Memory", attribute:"HeapMemoryUsage", path:"max"}, 
	"HeapMem"
);

var gcCount = jolokia.metric(
    {type:"read", mbean:"java.lang:type=GarbageCollector,name=MarkSweepCompact", attribute:"CollectionCount"},
    {delta:1000, name:"GC MarkSweepCompact"}
);

var gcCount2 = jolokia.metric(
    {type:"read", mbean:"java.lang:type=GarbageCollector,name=Copy", attribute:"CollectionCount"},
    {delta:1000, name:"GC Copy"}
);

var jtsRequest = jolokia.metric(
    {type:        "read", mbean:"Catalina:j2eeType=Servlet,name=equinoxbridgeservlet,WebModule=//localhost/jts,J2EEApplication=none,J2EEServer=none",
        attribute:"requestCount"}, {name:"JTS", delta: 10 * 1000}
);
		
var ccmRequest = jolokia.metric(
    {type:        "read", mbean:"Catalina:j2eeType=Servlet,name=equinoxbridgeservlet,WebModule=//localhost/ccm,J2EEApplication=none,J2EEServer=none",
        attribute:"requestCount"}, {name:"CCM", delta: 10 * 1000}
);
		
var allRequests = jolokia.metric(
    function (resp) {
        var attrs = resp.value;
        var sum = 0;
        for (var key in attrs) {
            sum += attrs[key].requestCount;
        }
        return sum;
    },
    {type:        "read", mbean:"Catalina:j2eeType=Servlet,*",
        attribute:"requestCount"}, {name:"All", delta: 10 * 1000}
);

		
var thread = jolokia.metric(
    function (resp1, resp2) {
	    return Number(resp1.value) / Number(resp2.value); 
   },
    { type: "read", mbean: "java.lang:type=Threading", attribute: "ThreadCount"},
    { type: "read", mbean: 'Catalina:name=\"http-bio-9443\",type=ThreadPool', attribute: "maxThreads"}, 
	"Threads"
);


var colorsRed = ["#FDBE85", "#FEEDDE", "#FD8D3C", "#E6550D", "#A63603", "#FDBE85", "#FEEDDE", "#FD8D3C", "#E6550D", "#A63603" ],
    colorsGreen = [ "#E5F5F9", "#99D8C9", "#2CA25F", "#E5F5F9", "#99D8C9", "#2CA25F"],
    colorsBlue = [ "#ECE7F2", "#A6BDDB", "#2B8CBE", "#ECE7F2", "#A6BDDB", "#2B8CBE"];

// Created graphs

    d3.select("#memory").call(function (div) {

        div.append("div")
            .attr("class", "axis")
            .call(context.axis().orient("top"));

        div.selectAll(".horizon")
            .data([memory])
            .enter().append("div")
            .attr("class", "horizon")
            .call(
            context.horizon()
                .colors(colorsRed)
                .format(d3.format(".4p"))
        );
        div.selectAll(".horizon-gc")
            .data([gcCount2, gcCount])
            .enter().append("div")
            .attr("class", "horizon horizon-gc")
            .call(
            context.horizon().colors(colorsRed).height(20)
        );
        div.append("div")
            .attr("class", "rule")
            .call(context.rule());

    });
	
	
	
	d3.select("#request").call(function (div) {
        div.append("div")
            .attr("class", "axis")
            .call(context.axis().orient("top"));


        div.selectAll(".horizon")
            .data([ jtsRequest, ccmRequest, allRequests])
            .enter()
            .append("div")
            .attr("class", "horizon")
            .call(context.horizon()
                  .format(d3.format("2d"))
                  .colors(function (d, i) {
                      return i == 3 ? colorsBlue : colorsGreen
                  }));

        div.append("div")
            .attr("class", "rule")
            .call(context.rule());

    });
	
	d3.select("#thread").call(function (div) {
	        div.append("div")
	            .attr("class", "axis")
	            .call(context.axis().orient("top"));

	        div.selectAll(".horizon")
	            .data([thread])
	            .enter().append("div")
	            .attr("class", "horizon")
	            .call(context.horizon()
	                .colors(function (d, i) {
                               return i == 3 ? colorsGreen : colorsRed
                           })
	                .format(d3.format(".4p"))
	        );
	        
	        div.append("div")
	            .attr("class", "rule")
	            .call(context.rule()
			);

	    });

   
    // On mousemove, reposition the chart values to match the rule.
    context.on("focus", function (i) {
        d3.selectAll("#memory .value").style("right", i == null ? null : context.size() - i + "px");
		d3.selectAll("#request .value").style("right", i == null ? null : context.size() - i + "px");
		d3.selectAll("#thread .value").style("right", i == null ? null : context.size() - i + "px");
    });



});

function gc() {
	var j4p = new Jolokia("https://localhost:9443/jolokia");
    j4p.request({type:"exec", mbean:"java.lang:type=Memory", operation:"gc"});
}
	


