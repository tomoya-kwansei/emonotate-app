function GraphView(graphId, curve, request) {
    this.changeDataFrom = function(item) {
        return {
            "start": this.changeSecondsFrom(item.start),
            "end": this.changeSecondsFrom(item.end),
            "text": item.text
        };
    }.bind(this);
    this.changeSecondsFrom = function(time) {
        let array = time.split(":").map((str, i) => Number(str) * Math.pow(60, 2 - i));
        return array.reduce(function(sum, element) {
            return sum + element;
        });
    }.bind(this);
    this.graphId = graphId;
    this.stage = acgraph.create(graphId);
    this.layer = this.stage.layer();
    this.curve = curve;
    this.path = acgraph.path();
    this.subPath = acgraph.path();
    this.width = 640;
    this.height = 320;
    this.isDragging = false;
    this.subValues = [];
    this.borders = [];
    if(request.is_included_section) {
        this.sections = request.section.values.map(this.changeDataFrom);
    } else {
        this.sections = [];
    }

    this.initialize = function(duration) {
        this.duration = duration;
        this.graphArea = this.layer
            .rect(0, 0, this.width , this.height)
            .fill("#FFFFaa");

        this.curve.values = [
            {"x": 0.0, "y": 0.0},
            {"x": duration, "y": 0.0}
        ];
        this.layer.listen(
            "mousedown", 
            function(ev) {
                this.isDragging = true;
                const { offsetX, offsetY } = ev;
                this.subValues.push({
                    x: this.xScale(offsetX),
                    y: this.yScale(offsetY)
                });
                this.drawGraph();
            }.bind(this));
        this.layer.listen(
            "mousemove", 
            function(ev) {
                if(!this.isDragging) {
                    return;
                }
                const { offsetX, offsetY } = ev;
                this.subValues.push({
                    x: this.xScale(offsetX),
                    y: this.yScale(offsetY)
                });
                this.drawGraph();
            }.bind(this));
        this.layer.listen(
            "mouseup", 
            function(ev) {
                this.isDragging = false;
                const { offsetX, offsetY } = ev;
                this.subValues.push({
                    x: this.xScale(offsetX),
                    y: this.yScale(offsetY)
                });
                this.updateData();
                this.drawGraph();
            }.bind(this));
        this.drawGraph();
    }.bind(this);

    this.drawGraph = function() {
        this.path.remove();
        this.path = acgraph.path();
        this.layer.addChild(this.path);
        this.stage.suspend();
        this.drawLines();
        this.drawMainGraph();
        this.drawSubGraph();
        this.stage.resume();
    }.bind(this);

    this.drawLines = function() {
        for(var border of this.borders) {
            border.remove();
        }
        let borders = this.sections
            .slice(0, this.sections.length - 1)
            .map(item => item.end);
        this.borders = [];
        for(let x of borders) {
            let path = acgraph.path();
            path.moveTo(this.xScaleInvert(x), 0);
            path.lineTo(this.xScaleInvert(x), this.height);
            path.stroke("#aaa", 2, "2 2")
            this.borders.push(path);
            this.layer.addChild(path);
        }
    }.bind(this);

    this.drawMainGraph = function() {
        let points = this.curve.values.map(function(point) {
            return {
                x: this.xScaleInvert(point.x),
                y: this.yScaleInvert(point.y)
            };
        }.bind(this));

        let path = this.path.moveTo(
            points[0].x,
            points[0].y
        );
        for(var point of points.slice(1)) {
            path.lineTo(point.x, point.y);
        }
    }.bind(this);

    this.drawSubGraph = function() {
        let points = this.subValues.map(function(point) {
            return {
                x: this.xScaleInvert(point.x),
                y: this.yScaleInvert(point.y)
            };
        }.bind(this));
        if(points.length > 0) {
            let path = this.path.moveTo(
                points[0].x,
                points[0].y
            );
            for(var point of points.slice(1)) {
                path.lineTo(point.x, point.y);
            }
        }
    }.bind(this);

    this.updateData = function() {
        this.subValues.sort(this.comparisonFunction);
        if(this.subValues.length > 0) {
            let start = this.subValues[0].x;
            let end = this.subValues[this.subValues.length - 1].x;
            this.curve.values = this.curve.values.filter(function(p) {
                return p.x < start || p.x > end;
            });
            this.curve.values.push(...this.subValues);
        }
        this.curve.values.sort(this.comparisonFunction);
        this.subValues = [];
    }.bind(this);

    this.comparisonFunction = function(p1, p2) {
        if(p1.x > p2.x) {
            return 1;
        } else if(p1.x < p2.x) {
            return -1;
        } else {
            return 0;
        }
    };

    this.xScale = function(x) {
        return this.duration * x / this.width;
    }.bind(this);

    this.yScale = function(y) {
        return y / this.height;
    }.bind(this);

    this.xScaleInvert = function(xValue) {
        return this.width * (xValue / this.duration);
    }.bind(this);

    this.yScaleInvert = function(yValue) {
        return yValue * this.height;
    }.bind(this);
}
