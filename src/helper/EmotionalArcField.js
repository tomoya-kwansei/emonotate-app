import * as d3 from "d3";

function EmotionalArcField(chartId, player, axis, option) {
    this.name = chartId;
    this.isValid = false;
    this.chart = document.getElementById(chartId);
    this.video = player;
    this.axis = axis;
    this.tooltip = d3.select("body").append("div").attr("class", "tooltip");
    this.option = option;
    if(!this.chart || !this.video || !this.axis) throw `can't find node`;
    return this;
}

EmotionalArcField.loadScript = function(src) {
    return new Promise((resolve, reject) => {
        var base = document.getElementsByTagName("script")[0];
        var obj = document.createElement("script");
        obj.async = true;
        obj.src= src;
        if(obj.addEventListener){
            obj.onload = function () {
                resolve(true);
            }
        }else{
            obj.onreadystatechange = function () {
                if ("loaded" == obj.readyState || "complete" == obj.readyState){
                    obj.onreadystatechange = null;
                    resolve(true);
                }
            }
        }
        base.parentNode.insertBefore(obj,base);
    });
};

EmotionalArcField.prototype.OnInit = function() {
    this.isValid = true;
    this.onInitVideoLoaded();
    this.onVideoLoaded();
}

EmotionalArcField.prototype.updateVideo = function() {
    this.current = this.video.getCurrentTime();
    this.svg.select(".head-line")
        .attr("x1", this.xScale(this.current))
        .attr("x2", this.xScale(this.current));
}

EmotionalArcField.prototype.onInitVideoLoaded = function() {
    var self = this;
    this.data = [];
    this.svg = d3.select('#chart');
    var margin = { top: 20, right: 20, bottom: 20, left: 40 };
    this.current = 0.0;
    this.duration = this.video.getDuration();
    this.size = {
        width: this.chart.clientWidth,
        height: this.chart.clientHeight,
    };

    this.xScale = d3.scaleLinear()
        .domain([0, this.duration])
        .range([margin.left, this.size.width - margin.right]);
    this.yScale = d3.scaleLinear()
        .domain([this.axis.maxValue, this.axis.minValue])
        .range([margin.top, this.size.height - margin.bottom]);
    var xScale = this.xScale;
    var yScale = this.yScale;
    var xAxis = d3.axisBottom(this.xScale);
    var yAxis = d3.axisLeft(this.yScale);

    this.svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', this.size.width)
        .attr('height', this.size.height)
        .attr('fill', 'white');

    this.svg.append("g").attr("class", "axis")
        .attr("transform", "translate(" + [0, this.size.height - margin.bottom] + ")")
        .call(xAxis);

    this.svg.append("g").attr("class", "axis")
        .attr("transform", "translate(" + [margin.left, 0] + ")")
        .call(yAxis);
    
    this.svg.select('rect').on("click", function() {
        var coords = d3.mouse(this);
        var newData = {
            x: Math.round(xScale.invert(coords[0]) * 100) / 100,
            y: Math.round(yScale.invert(coords[1]) * 100) / 100,
            axis: 'hv',
            type: 'custom',
        };

        if(0 <= newData.x && newData.x <= self.duration && 
            self.axis.minValue <= newData.y && newData.y <= self.axis.maxValue) {
            self.data.push(newData);
            self.update();
        }
    });

    this.line = d3.line()
        .x((_, i) => {
            return this.xScale(this.data[i].x);
        })
        .y((_, i) => {
            return this.yScale(this.data[i].y);
        });
    
    this.svg.append("path")
        .attr("class", "line")
        .attr("stroke", this.option.color)
        .attr("fill", 'white')
        .attr("d", this.line(this.data));
    
    this.headLine = this.svg.append("line")
        .attr('class', 'head-line')
        .attr('x1', this.xScale(this.current))
        .attr('y1', margin.top)
        .attr('x2', this.xScale(this.current))
        .attr('y2', this.size.height - margin.bottom)
        .attr("stroke-width",4)
        .attr("stroke","#0e9aa7");
}

EmotionalArcField.prototype.onVideoLoaded = function() {
    // throw 'NOT IMPLEMENTED';
}

EmotionalArcField.prototype.load = function(data) {
    if(!this.isValid) throw `${this.name} must be loaded when this chart is loaded data.`
    if(!data) throw `data must not be ${data}`
    if(!Array.isArray(data)) throw `type: "data" expected Array but ${typeof(data)}`;

    this.data = data;
    this.update();
}

EmotionalArcField.prototype.update = function() {
    const xScale = this.xScale;
    const yScale = this.yScale;
    this.data.sort((d1, d2) => { 
        if(d1.x > d2.x) return 1;
        else if(d1.x < d2.x) return -1;
        return 0;
    });

    const circle = this.svg.selectAll("circle")
        .data(this.data, d => { return d; });
    this.svg.select(".line").attr("d", this.line(this.data));
    circle.enter().append("circle")
        .attr("fill", "white")
        .attr("stroke", "rgb(0, 0, 0)")
        .attr("class", "graph-point")
        .attr("cx", (d) => { 
            return xScale(d.x); 
        })
        .attr("cy", (d) => { 
            return yScale(d.y);
        })
        .style("cursor", function(d) { 
            if(d.axis.includes('v') && d.axis.includes('h')) return 'all-scroll';
            else if(d.axis.includes('v')) return 'ns-resize';
            else if(d.axis.includes('h')) return 'ew-resize';
            else return 'pointer';
        })
        .attr("r", this.option.r)
        .call(this.onDraggablePoint())
        .on('dblclick', (d, i) => {
            if(d.type == 'custom') {
                this.data.splice(i, 1);
                this.update();
            }
        })
        .on("mouseover", (d) => {
            this.tooltip
                .style("visibility", "visible")
                .html("x : " + d.x + "<br>y : " + d.y);
            })
        .on("mouseout", (d) => { 
            this.tooltip.style("visibility", "hidden");
            });
    circle
        .attr("stroke", "rgb(0, 0, 0)")
        .attr("fill", "white")
        .attr("cx", (d) => { 
            return xScale(d.x); 
        })
        .attr("cy", (d) => { 
            return yScale(d.y);
        })
        .style("cursor", function(d) {
            if(d.axis.includes('v') && d.axis.includes('h')) return 'all-scroll';
            else if(d.axis.includes('v')) return 'ns-resize';
            else if(d.axis.includes('h')) return 'ew-resize';
            else return 'pointer';
        })
        .attr("r", this.option.r)
        .call(this.onDraggablePoint())
        .on('dblclick', (d, i) => {
            if(d.type == 'custom') {
                this.data.splice(i, 1);
                this.update();
            }
        })
        .on("mouseover", (d) => { 
            this.tooltip
                .style("visibility", "visible")
                .html("x : " + d.x + "<br>y : " + d.y);
            })
        .on("mouseout", () => { 
                this.tooltip.style("visibility", "hidden");
            });
    circle.exit().remove();
}

EmotionalArcField.prototype.onDraggablePoint = function() {
    const xScale = this.xScale;
    const yScale = this.yScale;
    const vis = this.svg.select('rect');
    return d3.drag()
        .on('start', d => {
            this.selected = d;
        })
        .on('drag', d => {
            const coords = d3.mouse(vis.node());
            this.selected.x = d.axis.includes('h') ? 
                Math.max(0, Math.min(this.duration, Math.round(xScale.invert(coords[0]) * 100) / 100)) : d.x;
                this.selected.y = d.axis.includes('v') ? Math.max(this.axis.minValue, 
                Math.min(this.axis.maxValue, Math.round(yScale.invert(coords[1]) * 100) / 100)) : d.y;
            this.update();
        })
        .on('end', d => {
            this.selected = undefined;
            this.video.seekTo(d.x);
        });
}

EmotionalArcField.prototype.submit = function(user, content, valueType, roomName, version) {
    var data = {
        'user': user.id,
        'content': content.id,
        'value_type': valueType.id,
        'values': this.data,
        'version': version,
        'room_name': roomName || "",
    };
    fetch('/api/curves/?format=json', {
        method: 'POST',
        headers: {
            'X-CSRFToken': window.django.csrf,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(function(res) {
        if(res.status != 200 && res.status != 201) throw res;
        return res.json();
    }).then(function(json) {
        window.location = '/';
    }).catch(err => {
        return err.text();
    }).then(text => {
        console.log(text);
    });
}

EmotionalArcField.prototype.updateOf = function(user, curveId, content, valueType, version) {
    var data = {
        'user': user.id,
        'content': content.id,
        'value_type': valueType.id,
        'values': this.data,
        'version': version
    };
    fetch(`/api/curves/${curveId}?format=json`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': window.django.csrf,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(function(res) {
        if(res.status != 200 && res.status != 201) throw res;
        return res.json();
    }).then(function(json) {
        window.location = '/';
    }).catch(err => {
        return err.text();
    }).then(text => {
        console.log(text);
    });
}

export default EmotionalArcField;
