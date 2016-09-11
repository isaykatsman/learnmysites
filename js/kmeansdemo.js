//2D point data
var data = [  
    [1, 2],
    [2, 1],
    [2, 4], 
    [1, 3],
    [2, 2],
    [3, 1],
    [1, 1],

    [7, 3],
    [8, 2],
    [6, 4],
    [7, 4],
    [8, 1],
    [9, 2],

    [10, 8],
    [9, 10],
    [7, 8],
    [7, 9],
    [8, 11],
    [9, 9],
];

var means = [];
var assignments = [];
var drawDelay = 500;
var scale = 20;
var tsnegraph;

function getDataRanges(extremes) {  
    var ranges = [];
    for (var dimension in extremes) {
        ranges[dimension] = extremes[dimension].max - extremes[dimension].min;
    }
    return ranges;
}

function getDataExtremes(points) {
    var extremes = [];
    for (var i in data) {
        var point = data[i];
        for (var dimension in point) {
            if (!extremes[dimension]) {
                extremes[dimension] = {min: 1000, max: 0};
            }

            if (point[dimension] < extremes[dimension].min) {
                extremes[dimension].min = point[dimension];
            }

            if (point[dimension] > extremes[dimension].max) {
                extremes[dimension].max = point[dimension];
            }
        }
    }

    return extremes;
}

function initMeans(k) {
    if (!k){
        k = Math.ceil(Math.pow(data.length,(1/2))/2);
    }

    while (k--) {
        var mean = [];
        for (var dimension in dataExtremes) {
            mean[dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
        }
        means.push(mean);
    }
    return means;
}

function makeAssignments() {
    for (var i in data) {
        var point = data[i];
        var distances = [];
        for (var j in means) {
            var mean = means[j];
            var sum = 0;

            for (var dimension in point) {
                var difference = point[dimension] - mean[dimension];
                difference *= difference;
                sum += difference;
            }

            distances[j] = Math.sqrt(sum);
        }
        assignments[i] = distances.indexOf( Math.min.apply(null, distances) );
    }
}

function moveMeans() {
    makeAssignments();

    var sums = Array( means.length );
    var counts = Array( means.length );
    var moved = false;

    for (var j in means) {
        counts[j] = 0;
        sums[j] = Array( means[j].length );
        for (var dimension in means[j]) {
            sums[j][dimension] = 0;
        }
    }

    for (var point_index in assignments) {
        var mean_index = assignments[point_index];
        var point = data[point_index];
        var mean = means[mean_index];

        counts[mean_index]++;

        for (var dimension in mean) {
            sums[mean_index][dimension] += point[dimension];
        }
    }

    for (var mean_index in sums) {
        console.log(counts[mean_index]);
        if (0 === counts[mean_index]) {
            sums[mean_index] = means[mean_index];
            console.log("Mean with no points");
            console.log(sums[mean_index]);

            for (var dimension in dataExtremes) {
                sums[mean_index][dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
            }
            continue;
        }

        for (var dimension in sums[mean_index]) {
            sums[mean_index][dimension] /= counts[mean_index];
        }
    }

    if (means.toString() !== sums.toString()) {
        moved = true;
    }

    means = sums;
    return moved;
}

function setup() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    //clear frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    means = [];
    assignments = [];
    if(tsnegraph != null) {
      tsnegraph.unload();
    }

    dataExtremes = getDataExtremes(data);
    dataRange = getDataRanges(dataExtremes);
    means = initMeans(3);

    makeAssignments();
    //graph initial data
    for (var i = 0; i < data.length; i++) {
        ctx.fillStyle = "#0000FF";
        ctx.beginPath();
        ctx.arc(data[i][0]*scale, data[i][1]*scale, 5, 0, Math.PI * 2, true);
        ctx.fill();
    }

    //graph means
    console.log(means);
    for (var i = 0; i < means.length; i++) {
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(means[i][0]*scale, means[i][1]*scale, 5, 0, Math.PI * 2, true);
        ctx.fill();
    }

    //keep iterating k-means
    setTimeout(run, drawDelay);
}

function run() {
    var moved = moveMeans();
    //draw();

    //clear frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //graph initial data
    for (var i = 0; i < data.length; i++) {
        ctx.fillStyle = "#0000FF";
        ctx.beginPath();
        ctx.arc(data[i][0]*scale, data[i][1]*scale, 5, 0, Math.PI * 2, true);
        ctx.fill();
    }

    //graph means
    console.log(means);
    for (var i = 0; i < means.length; i++) {
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(means[i][0]*scale, means[i][1]*scale, 5, 0, Math.PI * 2, true);
        ctx.fillText("C"+i, means[i][0]*scale, means[i][1]*scale);
        ctx.fill();
    }

    if (moved) {
        setTimeout(run, drawDelay);
    } else {
        //didn't move, we've finished, k-means has converged
        //run tSNE and then graph projected embedding with C3/D3
        runtSNEAndGraph();
    }
}

function runtSNEAndGraph() {
  //run tsne on pts, then extract data and make a better plot
  var opt = {}
  opt.epsilon = 10;
  opt.perplexity = 2;
  opt.dim = 2;

  var tsne = new tsnejs.tSNE(opt); //create tSNE instance

  //init data with data and means
  console.log(data);
  var points = data.concat(means);

  //initialize with points, not distances
  tsne.initDataRaw(points);

  //do 500 iterations of tSNE
  for(var j = 0; j < 1000; j++) {
    tsne.step(); // solution gets progressively better
  }

  //get the solution
  var solution = tsne.getSolution(); //array of 2D points

  //slice out the data points and the means
  var tSNEmeans = solution.slice(-means.length);
  var tSNEdata = solution.slice(0,data.length);

  //data for scatter plot
  //var data = [[5,3], [10,17], [15,4], [2,8]];
  var data2 = tSNEdata;
  console.log(data2);

  //now graph data2 with c3

  //first parse necessary x and y lists
  var dx = []; //data x
  var dy = []; //data y
  var mx = []; //mean x
  var my = []; //mean y

  //init data x and data y
  for(var i = 0; i < tSNEdata.length; i++) {
    dx.push(tSNEdata[i][0]);
    dy.push(tSNEdata[i][1]);
  }

  //init mean x and mean y
  for(var i = 0; i < tSNEmeans.length; i++) {
    mx.push(tSNEmeans[i][0]);
    my.push(tSNEmeans[i][1]);
  }

  //name the lists
  dx = ["DataX"].concat(dx);
  dy = ["DataY"].concat(dy);
  mx = ["MeansX"].concat(mx);
  my = ["MeansY"].concat(my);
  
  //now graph with c3
  tsnegraph = c3.generate({
    bindto: '#chart',
    data: {
      xs: {
        DataY: 'DataX',
        MeansY: 'MeansX',
      },
      columns: [
        dx,
        mx,
        dy,
        my,
      ],
      type: 'scatter'
    },
    axis: {
        x: {show: false},
        y: {show: false}
    },
    point: {
        r: 5
    },
    tooltip: {
        format: {
            title: function (d) { return 'Cluster ' + d; },
            value: function (value, ratio, id) {
                var format = id === 'data1' ? d3.format(',') : d3.format('');
                return format(value);
            }
//            value: d3.format(',') // apply this format to both y and y2
        }
    },
    color: {
        pattern: ['#0000FF', '#FF0000']
    }
  });
}