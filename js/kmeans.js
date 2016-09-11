//2D point data
var test_data = [  
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

var assignments=[];
var means = [];
var drawDelay = 500;
var scale = 10;
//colors for centroids;
var colors = ['#FF0000','#00FF00','#0000FF','#F0FF0F','#A0AAAA','#0FFFF0','#CBFEBC','#0F0F0F','#1212FF'];

function getDataRanges(extremes) {  
    var ranges = [];
    for (var dimension in extremes) {
        ranges[dimension] = extremes[dimension].max - extremes[dimension].min;
    }
    return ranges;
}

function getDataExtremes(data) {
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

function initMeans(data, k) {
    if (!k){
        k = Math.ceil(Math.pow(data.length,(1/2)));
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

function makeAssignments(data) {
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
    return assignments;
}

function moveMeans(data) {
    makeAssignments(data);

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
            // console.log(sums[mean_index]);

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

function setup(data, meta) {
    console.log(data);
    console.log(meta);

    dataExtremes = getDataExtremes(data);
    dataRange = getDataRanges(dataExtremes);
    means = initMeans(data);

    makeAssignments(data);
    //graph initial data
    //graph means
    console.log(means.length, means);
    //keep iterating k-means
    run(data, meta);
}

function run(data, meta) {
    var moved = moveMeans(data);
    //draw();

    console.log(data);
    if (moved) {
      run(data, meta);
    } else {
      //didn't move, we've finished, k-means has converged
      //run tSNE and then graph projected embedding with C3/D3
      runtSNEAndGraph(data, meta);
    }
}

function runtSNEAndGraph(data, meta) {
  //run tsne on pts, then extract data and make a better plot
  var opt = {}
  opt.epsilon = 10;
  opt.perplexity = 10;
  opt.dim = 2;

  var tsne = new tsnejs.tSNE(opt); //create tSNE instance

  //init data with data and means
  var points = data.concat(means);

  //initialize with points, not distances
  tsne.initDataRaw(points);

  //do 500 iterations of tSNE
  for(var j = 0; j < 10000; j++) {
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
  var chart = c3.generate({
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
    size: {
      height: 500,
      width: 1000
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
            title: function (d) {
              for(var i = 0; i < tSNEmeans.length; i++) {
                if(tSNEmeans[i][0]==d) {
                  return 'Cluster centroid ' + i;
                } else {
                  //now loop through data
                  for(var j = 0; j < tSNEdata.length; j++) {
                    if(tSNEdata[j][0]==d) {
                      return 'Cluster point ' + assignments[j];
                    }
                  }
                }
              }
              return 'Cluster not centroid';
            },
            value: function (value, ratio, id) {
                //var format = id === 'data1' ? d3.format(',') : d3.format('');
                //return format(value);
                return "";
            }
//            value: d3.format(',') // apply this format to both y and y2
        }
    },
    color: {
        pattern: ['#0000FF', '#FF0000']
    }
  });

  var labels = [
    [],
    ['ZA', 'ZB', 'ZC', 'ZD', 'ZE', 'ZF', 'ZG', 'ZH']
  ];
  // series
  var series = chart.internal.main
                  .selectAll('.' + c3.chart.internal.fn.CLASS.circles)[0];
  // text layers
  var texts = chart.internal.main
                  .selectAll('.' + c3.chart.internal.fn.CLASS.chartTexts)
                  .selectAll('.' + c3.chart.internal.fn.CLASS.chartText)[0]
  series.forEach(function (series, i) {
      var points = d3.select(series).selectAll('.' + c3.chart.internal.fn.CLASS.circle)[0]
      points.forEach(function (point, j) {
          d3.select(texts[i])
              .append('text')
              .attr('text-anchor', 'middle')
              .attr('dy', '0.3em')
              .attr('x', d3.select(point).attr('cx'))
              .attr('y', d3.select(point).attr('cy'))
              .text(labels[i][j])
      })
  });

  //now that graphin has been performed populate cluster feed
  populateClusterFeed(data, meta);
}

function mode(array)
{
    if(array.length == 0)
      return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
      var el = array[i];
      if(modeMap[el] == null)
        modeMap[el] = 1;
      else
        modeMap[el]++;  
      if(modeMap[el] > maxCount)
      {
        maxEl = el;
        maxCount = modeMap[el];
      }
    }
    return maxEl;
}

function getClusterNames(data, meta) {
  var cluster_names = [];
  var numclusters = Math.ceil(Math.pow(data.length,(1/2)));
  console.log(numclusters);
  var pool = []; // word pool
  for(var i = 0; i < numclusters; i++) {
    for(var j = 0; j < data.length; j++) {
      //if cluster j is in cluster i then get it
      if(assignments[j] == i) {
        pool = pool.concat(meta[j].text);
        console.log(pool);
      }
    }

    //now assign cluster name, most frequent word in pool
    cluster_names.push(mode(pool));
    console.log('cluster: ' + mode(pool));
    //now reset pool and find mode for next cluster
    pool = [];
  }
  console.log(cluster_names);
  return cluster_names;
}

function populateClusterFeed(data, meta) {
  //indices 0,1,2 - > clusterName1, clusterName2, clusterName2
  //order preservation expected
  var cluster_names = getClusterNames(data, meta);

  //populate cluster feed using clusternmames
  var nondegen = 0; //nondegenerate index
  for(var i = 0; i < cluster_names.length; i++) {
    //populate tab content corresponding to link title with top 3 entries from cluster - if less than 3 then skip
    var cluster_size = 0;
    var articles = [];
    for(var j = 0; j < data.length; j++) {
      if(assignments[j] == i) {
        cluster_size++;
        articles.push(j);
      }
    }

    if(cluster_size < 3) {
      continue;
    }

    nondegen++;

    //populate tab title
    $("#tabnameparent").append("<li class=\"nav-item\"> <a class=\"nav-link active\" data-toggle=\"tab\" href=\"#interest"+(nondegen)+"\" id=\"link"+(nondegen)+"\" role=\"tab\">"+cluster_names[nondegen-1]+"</a></li>");
    
    //add tab content pane
    if(i==0) {
      $("#tabcontentparent").append("<div class=\"tab-pane fade in active\" id=\"interest"+(nondegen)+"\" role=\"tabpanel\"></div>");
    } else {
      $("#tabcontentparent").append("<div class=\"tab-pane fade in\" id=\"interest"+(nondegen)+"\" role=\"tabpanel\"></div>");
    }

    //populate tab content with (limit to 4?) all articles for this cluster
    for(var j = 0; j < articles.length; j++) {
      var index = articles[j];

      var title = meta[index].title;
      var desc = meta[index].desc;
      var link = meta[index].link;

      $("#interest"+(nondegen)).append("<a href=\""+link+"\" style=\"color:black;text-decoration:none;\" onmouseover=\"this.style.background='#EEEEEE';\" onmouseout=\"this.style.background='#FFFFFF';\" target=\"_blank\" class=\"card card-block\"> <h4 class=\"card-title\">\""+title+"\" -youtube.com</h4>  <p class=\"card-text\">"+desc+"</p> </a>");
    }
  }

  /*loop through cluster_names
    -populate link title
    -add all children of this cluster id to that tab-pane
  end loop*/
}
