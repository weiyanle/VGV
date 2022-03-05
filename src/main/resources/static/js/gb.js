var url = window.location.href;
var urlInfo = null;
var speInfo = null;
let backstack=[];
let forstack=[];
let mintime=1577289600000,maxtime=new Date().valueOf();
let packconfig=[0,mintime];
let pageconfig=[1,12];  //full模式下页数与每页数量
setIcon("gobackward",true);
setIcon("goforward",true);
if (url.indexOf("/gb/") !== -1) {
    var urlsplit = (url.split("spe=")[1]).split("&track=")[0]
    urlInfo = {
        spe: urlsplit.split("&")[0],
        chr: (urlsplit.split("loc=")[1]).split(":")[0],
        start: parseInt((urlsplit.split(":")[1]).split('..')[0]),
        end: parseInt((urlsplit.split(":")[1]).split('..')[1]),
        trk: url.split("&track=")[1],
        len: function () {
            return this.end - this.start + 1;
        }
    };
    backstack.push($.extend(true,{},urlInfo));
    //读取物种信息json文件
    speInfo = getJson('/VGV/track/' + urlInfo.spe + '/info.json');
    setIcon("toleft",urlInfo.start<=1);
    setIcon("toright",urlInfo.end>=speInfo.seq_len);
    setIcon("zoomin",urlInfo.len()<=25);
    setIcon("zoomout",urlInfo.len()>=speInfo.seq_len);
    var h3 = document.querySelector("#speinfo")
    h3.innerText = speInfo.info + '(' + urlInfo.spe + ')'
}

const objs = {
    seqobj: null,
    mulobj: null,
    refobj: null,
    proobj: null,
    domobj: null,
    trsobj: null,
    covobj: null,
    claobj: null,
};

const basecolor = {
    "A": "#FFFF00", "T": "#FF4500", "G": "#43CD80", "C": "#7B68EE",
    "-": "#AAAAAA", "N": "#FFE4C4", "U": "#FFA500", "R": "#F08080",
    "Y": "#DDA0DD", "K": "#D8BFD8", "M": "#54FF9F", "S": "#B3EE3A",
    "W": "#e80b63", "B": "#FFF5EE", "D": "#c63a29", "V": "#87CEFA",
    "H": "#00CED1", "X": "#c2bd93"
};
const aacolor = {
    "G": "#FFE4C4", "A": "#FFF5EE", "V": "#FFE4E1", "L": "#6495ED",
    "I": "#8470FF", "P": "#87CEFA", "F": "#00CED1", "Y": "#98FB98",
    "W": "#BDB76B", "S": "#F5DEB3", "T": "#FFA500", "C": "#F08080",
    "M": "#DDA0DD", "N": "#D8BFD8", "Q": "#54FF9F", "D": "#B3EE3A",
    "E": "#FFC1C1", "K": "#FF8C69", "R": "#FF00FF", "H": "#BF3EFF",
    "-": "#AAAAAA", "X": "#D8BFD8", "*": "#54FF9F"
};


let mask = document.querySelector(".mask");
if(mask!==null) {
    mask.addEventListener('click', function () {
        $(".emergediv").remove();
        mask.style.display = "none";
    });
}

var width = 900; //画布的宽度
var vertex = 0; //左上顶点x轴位置
var last_vertex = vertex; //redraw之前的vertex
var trandura = 1500; //过渡时间
var ovedivborderleft = 0; //overview的框拖动时需要用到
var oveTop= 40, oveLeft=144; //解决切换侧边栏时ove所在div位置变化问题

//根据分辨率展示
if(document.body.clientWidth<1323){
    $(".breadcrumb-holder").remove();
    $("section").remove();
    $("#speinfo").html("The current resolution is lower than the minimum required for visualization.<br>Please increase the screen resolution, or try to shrink the page or maximize the browser window, and then refresh the page.");
}else {
    let goodWidth=1519;
    if(document.body.clientWidth<1485&&$('#toggle-btn').attr("class")==='menu-btn active'){
        goodWidth=1363;
        $('.side-navbar').toggleClass('shrinked');
        $('.content-inner').toggleClass('active');
        $(document).trigger('sidebarChanged');
        $('#toggle-btn').remove();
    }
    width=900+(document.body.clientWidth-goodWidth);
    $("#sca,#sca2,#ove,.track-table tr td:nth-child(2)").css("width",width);
    $("#trackpanel").css("width",(url.indexOf("/gb/") === -1?1160:1080)+(document.body.clientWidth-goodWidth));
    oveLeft=document.getElementById("ove").offsetLeft;
    setTrack(); //绘制轨道
    oveTop=document.getElementById("ove").offsetTop;
}

$("#toggle-btn").bind("click",function(){
    $('.content-inner').toggleClass('active');
    let goodWidth=1519;
    if ($('#toggle-btn').hasClass('active')) {
        goodWidth=1363;
    }
    width=900+(document.body.clientWidth-goodWidth);
    $("#sca,#sca2,#ove,.track-table tr td:nth-child(2)").css("width",width);
    $("#trackpanel").css("width",(url.indexOf("/gb/") === -1?1160:1080)+(document.body.clientWidth-goodWidth));
    vertex=0;
    reset();
});

//确定绘制起止点，可视范围外左右最多画出一个urlInfo.len()
var drawleft;
var drawright;

function redraw() {
    drawleft = urlInfo.start - 1
    drawright = urlInfo.end
    if (drawleft - urlInfo.len() < 0) { //左边到头
        vertex -= (drawleft * width / urlInfo.len())
        drawleft = 0
    } else {
        drawleft -= urlInfo.len()
        vertex -= width
    }
    if (drawright + urlInfo.len() > speInfo.seq_len - 1) { //右边到头
        drawright = speInfo.seq_len - 1
    } else {
        drawright += urlInfo.len()
    }
}

//选取区域track
function oveTrack() {
    var height = 15;
    var svg = d3.select("#ove")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
    var xScale = d3.scaleLinear()
        .domain([1, speInfo.seq_len])
        .range([0, width]);
    var xAxis = d3.axisBottom(xScale)
        .ticks(5); //设置刻度数目
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0,10)")
        .call(xAxis)
        .selectAll("text")
        .style('font-size', 12)
        .attr("dy", -7)
    svg.selectAll("line,path")
        .remove()

    var div = document.getElementById("ove")
    var tp = document.getElementById("trackpanel")
    div.style.cursor = "crosshair"
    var div2 = document.createElement("div"); //绘制框
    div.appendChild(div2);
    div2.className = "ovedivborder"
    div2.style.top = oveTop - 4 + "px"
    ovedivborderleft = oveLeft + urlInfo.start / speInfo.seq_len * width
    div2.style.left = ovedivborderleft + "px"
    console.log()
    div2.style.width = urlInfo.len() / speInfo.seq_len * width + "px"
    var ondiv2 = false
    div2.onmousedown = function (ev) { //可移动框
        ondiv2 = true
        var oevent = ev || event;
        var distanceX = oevent.clientX - div2.offsetLeft;
        document.onmousemove = function (ev) {
            var oevent = ev || event;
            div2.style.left = Math.min(Math.max(div.offsetLeft, oevent.clientX - distanceX), width + div.offsetLeft - parseFloat(div2.style.width)) + 'px';
            var newstart = Math.round((parseFloat(div2.style.left) - div.offsetLeft) / width * speInfo.seq_len) + 1
            var newend = newstart + urlInfo.len() - 1
            $("#inpos1").val(newstart)
            $("#inpos2").val(newend)
            inputlen()
        }
        document.onmouseup = function (ev) {
            jump()
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }
    div.onmousedown = function (ev) {
        if (!ondiv2) {
            var oevent = ev || event;
            var div1 = document.createElement("div");
            div.appendChild(div1);
            div1.className = "ovediv"
            div1.style.top = div.offsetTop + "px" //相对于position设为relative的父元素（tp）的距离
            div1.style.left = oevent.clientX - _getAbsolutePosition(tp).left + "px"
            var distanceX = oevent.clientX;
            document.onmousemove = function (ev) {
                var oevent = ev || event;
                if (oevent.clientX - distanceX >= 0) { //注意不能超出track
                    div1.style.width = Math.min(oevent.clientX, width + _getAbsolutePosition(div).left) - distanceX + 'px';
                } else {
                    div1.style.left = Math.max(div.offsetLeft, oevent.clientX - _getAbsolutePosition(tp).left) + 'px';
                    div1.style.width = distanceX - Math.max(_getAbsolutePosition(div).left, oevent.clientX) + 'px';
                }
                var newstart = Math.max(1, Math.round((Math.min(distanceX, oevent.clientX) - _getAbsolutePosition(div).left) / width * speInfo.seq_len))
                var newend = Math.min(speInfo.seq_len, Math.round((Math.max(distanceX, oevent.clientX) - _getAbsolutePosition(div).left) / width * speInfo.seq_len))
                $("#inpos1").val(newstart)
                $("#inpos2").val(newend)
                inputlen()
            };
            document.onmouseup = function (ev) {
                jump()
                div.removeChild(div1)
                document.onmousemove = null;
                document.onmouseup = null;
            }
        }
    }
}

//获取元素相对浏览器的位置
function _getAbsolutePosition(obj) {
    //如果函数没有传入值的话返回对象为空的
    if (!obj) return null;
    var w = obj.offsetWidth,
        h = obj.offsetHeight;
    //从目标元素开始向外遍历，累加top和left值
    var t, l;
    for (t = obj.offsetTop, l = obj.offsetLeft; obj = obj.offsetParent;) {
        t += obj.offsetTop;
        l += obj.offsetLeft;
    }
    var r = document.body.offsetWidth - w - l;
    var b = document.body.offsetHeight - h - t;

    //返回定位元素的坐标集合
    return {width: w, height: h, top: t, left: l, right: r, bottom: b};
}

function scaleTrack() {
    var height = document.getElementById("tratab").offsetHeight + 50; //画布的高度
    var svg = d3.select("#sca") //选择文档中的元素
        .append("svg") //添加一个svg元素
        .classed("scasvg", true)
        .attr("width", width) //设定宽度
        .attr("height", height) //设定高度
        .attr("viewBox", [0, 0, width, height])
        .style("transition", "left 2s")
        .style("position", "relative")
        .style("left", "0px")
    /*
    .call(d3.zoom()
        .extent([
            [0, 0],
            [width, height]
        ])
        .translateExtent([
            [-Number.MAX_VALUE, 0],
            [Number.MAX_VALUE, height]
        ])
        .scaleExtent([1, 1])
        .on("zoom", zooming)
        .on("end", zoomed));
    */
    //比例尺画布大小需要根据是否在最左最右调整
    var scale_range = 2 * width;
    if (drawleft === 0 && drawright === speInfo.seq_len - 1) {
        scale_range = (urlInfo.start - 1) / urlInfo.len() * width + (speInfo.seq_len - urlInfo.end - 1) / urlInfo.len() * width + width
    } else if (drawleft === 0) {
        scale_range += (urlInfo.start - 1) / urlInfo.len() * width
    } else if (drawright === speInfo.seq_len - 1) {
        scale_range += (speInfo.seq_len - urlInfo.end - 1) / urlInfo.len() * width
    } else {
        scale_range += width
    }
    //为坐标轴定义一个线性比例尺
    var xScale = d3.scaleLinear()
        .domain([drawleft + 1, drawright + 1]) //为了让碱基坐标对准其左边
        .range([vertex, vertex + scale_range]); //比例尺位置
    //定义一个坐标轴
    var xAxis = d3.axisBottom(xScale) //定义一个axis
        .ticks(20); //设置刻度数目
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0,30)")
        .call(xAxis)
        .selectAll("text")
        .style('font-size', 12)
        .attr("dx", "0")
        .attr("dy", "-12") //文字移到轴上面
    svg.selectAll('.axis .tick') //添加网格线
        .each(function (d) {
            if (1 > -1) {
                d3.select(this).append('line')
                    .attr('class', 'grid')
                    .attr('stroke', 'grey')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', 0)
                    .attr('y2', height);
            }
        });

    var div = document.getElementById("sca2")
    var tp = document.getElementById("trackpanel")
    div.style.cursor = "crosshair"
    div.onmousedown = function (ev) {
        var oevent = ev || event;
        var div1 = document.createElement("div");
        div.appendChild(div1);
        div1.className = "ovediv"
        div1.style.top = "0px" //注意div父元素本身是relative，和ove不同
        div1.style.left = oevent.clientX - _getAbsolutePosition(div).left + "px"
        var distanceX = oevent.clientX;
        document.onmousemove = function (ev) {
            var oevent = ev || event;
            if (oevent.clientX - distanceX >= 0) { //注意不能超出track
                div1.style.width = Math.min(oevent.clientX, width + _getAbsolutePosition(div).left) - distanceX + 'px';
            } else {
                div1.style.left = Math.max(0, oevent.clientX - _getAbsolutePosition(div).left) + 'px';
                div1.style.width = distanceX - Math.max(_getAbsolutePosition(div).left, oevent.clientX) + 'px';
            }
            var newstart = Math.max(urlInfo.start, urlInfo.start + Math.round((Math.min(distanceX, oevent.clientX) - _getAbsolutePosition(div).left) / width * urlInfo.len()))
            var newend = Math.min(urlInfo.end, urlInfo.start + Math.round((Math.max(distanceX, oevent.clientX) - _getAbsolutePosition(div).left) / width * urlInfo.len()))
            $("#inpos1").val(newstart)
            $("#inpos2").val(newend)
            inputlen()
        };
        document.onmouseup = function (ev) {
            jump()
            div.removeChild(div1)
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }
}

function seqTrack() {
    var div = document.querySelector("#seq");
    if (urlInfo.len() < 300) {
        div.innerHTML = ''
        div.style.cursor = ""
        div.removeAttribute("onclick");
        seqTrack1()
    } else {
        div.innerHTML = 'Zoom in to see sequence'
        div.style.cursor = "pointer"
        div.setAttribute("onclick", "zoomin()")
    }
}

function seqTrack1() {
    if (objs.seqobj === null) {
        objs.seqobj = getJson('/VGV/track/' + urlInfo.spe + '/seq.json');
    }
    var height = 30; //画布的高度
    var rwidth = width / urlInfo.len();
    var rheight = 15;
    var cvt = {A: "T", T: "A", G: "C", C: "G"}
    var svg = addMovableSvg("#seq",width,height);
    //绘制碱基序列  
    var vertex_tmp = vertex
    for (let base of objs.seqobj.seq.substring(drawleft, drawright + 1)) { //注意左闭右开
        var rect = svg.append("rect") //添加一个矩形
            .attr("x", vertex_tmp)
            .attr("y", 0)
            .attr("width", rwidth)
            .attr("height", rheight)
            .attr("fill", basecolor[base])
            .attr("stroke", "black")
            .attr("stroke-width", .1)
        var rect = svg.append("rect") //添加一个矩形
            .attr("x", vertex_tmp)
            .attr("y", rheight)
            .attr("width", rwidth)
            .attr("height", rheight)
            .attr("fill", basecolor[cvt[base]])
            .attr("stroke", "black")
            .attr("stroke-width", .1)
        if (urlInfo.len() < 80) {
            var text = svg.append('text').text(base).attr('fill', 'black')
                .attr('x', vertex_tmp)
                .attr('y', 0)
                .attr('text-anchor', 'middle')
                .style('font-size', 12)
                .attr('dx', rwidth / 2)
                .attr('dy', rheight / 1.25)
            var text = svg.append('text').text(cvt[base]).attr('fill', 'black')
                .attr('x', vertex_tmp)
                .attr('y', rheight)
                .attr('text-anchor', 'middle')
                .style('font-size', 12)
                .attr('dx', rwidth / 2)
                .attr('dy', rheight / 1.25)
        }
        vertex_tmp += rwidth
    }
}

//序列比对文件track绘制
function alnTrack() {
    jobID = url.split("jobID=")[1];
    if (objs.mulobj === null) {
        objs.mulobj = getJson('/VGV/json/mul/jobID=' + jobID);
    }
    if (speInfo===null){
        speInfo = {
            nc: '',
            info: '',
            seq_len: objs.mulobj.seqs[0].seq_len
        };
    }
    if (urlInfo === null) {
        urlInfo = {
            spe: jobID,
            chr: "0",
            start: 1,
            end: speInfo.seq_len,
            trk: "0",
            len: function () {
                return this.end - this.start + 1;
            }
        };
        setIcon("toleft",urlInfo.start<=1);
        setIcon("toright",urlInfo.end>=speInfo.seq_len);
        setIcon("zoomin",urlInfo.len()<=25);
        setIcon("zoomout",urlInfo.len()>=speInfo.seq_len);
        backstack.push($.extend(true,{},urlInfo));
    }
    let isPro = urlInfo.spe.indexOf("Protein") !== -1;
    let isGene = urlInfo.spe.indexOf("Gene") !== -1;
    redraw();
    let height = 15; //画布的高度
    const rwidth = width / urlInfo.len();
    let rheight = 15;
    var h3innerT = ''
    $("#tratab").html('<tbody></tbody>')
    var svg_list = []
    var seqs_all = objs.mulobj.seqs.length - 3
    var vertex_tmp = vertex
    if (urlInfo.len() < 300) {
        for (let sp = 0; sp < seqs_all + 1; sp++) {
            if (sp !== seqs_all) {
                h3innerT += '<br>' + objs.mulobj.seqs[sp].info + '(' + objs.mulobj.seqs[sp].nc + ')'
                let name = objs.mulobj.seqs[sp].info;
                let title = objs.mulobj.seqs[sp].nc + " " + name;
                if (name.length > 12) name = name.substr(0, 9) + "...";
                $("#tratab").append($('<tr style="display: table-row;"><td ' + 'title="' + title + '">' + objs.mulobj.seqs[sp].nc + '<br>' + name + '</td><td id="seq' + sp + '"></td><td id="seqinfo' + sp + '" style="padding-left:10px;font-size:12px;"></td></tr>'))
                let fbi = urlInfo.start - 1 //first base index
                let lbi = urlInfo.end - 1 //last base index
                for (; fbi <= lbi && objs.mulobj.seqs[sp].seq[fbi] === '-'; fbi += 1) {
                }
                for (; fbi <= lbi && objs.mulobj.seqs[sp].seq[lbi] === '-'; lbi -= 1) {
                } //去除两端的'-'
                let res = objs.mulobj.seqs[sp].seq.slice(fbi - fbi % 100, fbi).match(/-/g) //计算零头中'-'的数目
                var rf = objs.mulobj.seqs[sp].base_num[Math.floor(fbi / 100)] + fbi % 100 - (!res ? 0 : res.length) //该序列中该碱基真正的位置
                res = objs.mulobj.seqs[sp].seq.slice(lbi - lbi % 100, lbi).match(/-/g)
                var rl = objs.mulobj.seqs[sp].base_num[Math.floor(lbi / 100)] + lbi % 100 - (!res ? 0 : res.length)
                $("#seqinfo" + sp).html('First "' + objs.mulobj.seqs[sp].seq[fbi] + '": ' + (rf + 1) + '<br>Last "' + objs.mulobj.seqs[sp].seq[lbi] + '": ' + (rl + 1))
                svg_list.push(addMovableSvg("#seq" + sp,width,height));
            } else {
                $("#tratab").append($('<tr style="display: table-row;"><td><p>Consensus</p></td><td id="seq' + sp + '"></td></tr>'))
                svg_list.push(addMovableSvg("#seq" + sp,width,height));
                $("#tratab").append($('<tr style="display: table-row;"><td><p>Conservation</p></td><td id="seq' + (sp+1) + '"></td></tr>'))
                svg_list.push(addMovableSvg("#seq" + (sp+1),width,height*3));
                $("#tratab").append($('<tr style="display: table-row;"><td><p>Sequence Diversity</p></td><td id="seq' + (sp+2) + '"></td></tr>'))
                svg_list.push(addMovableSvg("#seq" + (sp+2),width,height*3));
            }
        }
        //绘制碱基序列  
        for (let j = drawleft; j < drawright + 1; j++) { //注意左闭右开
            var lastbase = ''
            for (let i = 0; i < seqs_all; i++) {
                var base = objs.mulobj.seqs[i].seq[j]
                lastbase = base
                var rect = svg_list[i]
                    .append("rect") //添加一个矩形
                    .attr("x", vertex_tmp)
                    .attr("y", 0)
                    .attr("width", rwidth)
                    .attr("height", rheight)
                    .attr("fill", isPro ? (base in aacolor ? aacolor[base] : "#E8E8E8") : basecolor[base])
                    .attr("stroke", "black")
                    .attr("stroke-width", .1)
                if (urlInfo.len() < 120) {
                    var text = svg_list[i]
                        .append('text')
                        .text(base)
                        .attr('fill', 'black')
                        .attr('x', vertex_tmp)
                        .attr('y', 0)
                        .attr('text-anchor', 'middle')
                        .style('font-size', 12)
                        .attr('dx', rwidth / 2)
                        .attr('dy', rheight / 1.25)
                }
            }
            if (objs.mulobj.seqs[seqs_all].seq[j] !== '-') {
                var rect = svg_list[seqs_all].append("rect") //添加一个矩形
                    .attr("x", vertex_tmp)
                    .attr("y", 0)
                    .attr("width", rwidth)
                    .attr("height", rheight)
                    .attr("fill", "#8f9dc1")
                if (urlInfo.len() < 120) {
                    var text = svg_list[seqs_all]
                        .append('text')
                        .text(objs.mulobj.seqs[seqs_all].seq[j])
                        .attr('fill', '#333')
                        .attr('x', vertex_tmp)
                        .attr('y', 0)
                        .attr('text-anchor', 'middle')
                        .style('font-size', 12)
                        .style('font-weight', 'bold')
                        .attr('dx', rwidth / 2)
                        .attr('dy', rheight / 1.25)
                }
            }
            svg_list[seqs_all+1].append("rect") //添加一个矩形
                .attr("x", vertex_tmp)
                .attr("y", rheight*3*(1-objs.mulobj.seqs[seqs_all+1].base_num[j]/seqs_all))
                .attr("width", rwidth)
                .attr("height", rheight*3*objs.mulobj.seqs[seqs_all+1].base_num[j]/seqs_all)
                .attr("fill", "#ef8718")
            svg_list[seqs_all+2].append("rect") //添加一个矩形
                .attr("x", vertex_tmp)
                .attr("y", rheight*3*(1-objs.mulobj.seqs[seqs_all+2].base_num[j]))
                .attr("width", rwidth)
                .attr("height", rheight*3*objs.mulobj.seqs[seqs_all+2].base_num[j])
                .attr("fill", "#047d35")
            vertex_tmp += rwidth
        }
    } else {
        for (let sp = 0; sp < seqs_all; sp++) {
            h3innerT += '<br>' + objs.mulobj.seqs[sp].info + '(' + objs.mulobj.seqs[sp].nc + ')'
            }
        $("#tratab").append($('<tr style="display: table-row;"><td><p>Sequences</p></td><td style="cursor:pointer;" onclick="zoomin()">Zoom in to see sequences</td></tr>'))
        $("#tratab").append($('<tr style="display: table-row;"><td><p>Consensus</p></td><td id="seq' + (seqs_all) + '"></td></tr>'))
        svg_list.push(addMovableSvg("#seq"+ (seqs_all),width,height*3));
        $("#tratab").append($('<tr style="display: table-row;"><td><p>Conservation</p></td><td id="seq' + (seqs_all+1) + '"></td></tr>'))
        svg_list.push(addMovableSvg("#seq" + (seqs_all+1),width,height*3));
        $("#tratab").append($('<tr style="display: table-row;"><td><p>Sequence Diversity</p></td><td id="seq' + (seqs_all+2) + '"></td></tr>'))
        svg_list.push(addMovableSvg("#seq" + (seqs_all+2),width,height*3));
        //绘制同源序列展示情况，与展示GC含量代码类似
        var cnt = 0,cons_num = 0,step = 0,pct = 0,conser_num=0,diver_num=0;
        step = Math.ceil(urlInfo.len() / 300) //展示300个矩形，分辨率足够且计算量小，step为一个矩形包含的碱基数
        drawleft_floor = Math.floor(drawleft / step) * step //每个矩形的起始碱基都要是step的倍数
        for (let i = drawleft_floor; i < drawleft; ++i) {
            vertex_tmp -= rwidth
        }
        for (let i=drawleft_floor; i<drawright + 1;i++) {
            ++cnt
            if (objs.mulobj.seqs[seqs_all].seq[i] !== "-") ++cons_num;
            conser_num+=objs.mulobj.seqs[seqs_all+1].base_num[i];
            diver_num+=objs.mulobj.seqs[seqs_all+2].base_num[i];
            if (cnt % step === 0) {
                pct = cons_num / step
                svg_list[0].append("rect")
                    .attr("x", vertex_tmp)
                    .attr("y", 0)
                    .attr("width", rwidth * step)
                    .attr("height", rheight*3)
                    .attr("fill", "#" + Math.round(255 - (255 - 17) * pct).toString(16) + Math.round(255 - (255 - 17) * pct).toString(16) + Math.round(255 - (255 - 170) * pct).toString(16)) //把颜色转换到(255,255,255)与(17,17,170)范围内，实现渐变效果
                svg_list[1].append("rect")
                    .attr("x", vertex_tmp)
                    .attr("y", rheight*3*(1-conser_num/step/seqs_all))
                    .attr("width", rwidth * step)
                    .attr("height", rheight*3*conser_num/step/seqs_all)
                    .attr("fill", "#ef8718")
                svg_list[2].append("rect")
                    .attr("x", vertex_tmp)
                    .attr("y", rheight*3*(1-diver_num/step))
                    .attr("width", rwidth * step)
                    .attr("height", rheight*3*diver_num/step)
                    .attr("fill", "#047d35")
                cons_num = conser_num=diver_num=0
            }
            vertex_tmp += rwidth
        }
    }
    var h3 = $("#speinfo")
    h3innerT = h3innerT.slice(4)
    if (seqs_all > 1) {
        $("#h3con").attr('onclick', '$(\"#speinfo\").html("' + h3innerT + '");$(this).css("cursor","default");');
        $("#h3con").css("cursor", "pointer");
        h3.html(h3innerT.split('<br>')[0] + '...');
    } else {
        h3.html(h3innerT)
    }
}

//新冠病毒序列文件track绘制
function covTrack() {
    let argus = url.split("/ncov")[1];
    if (objs.covobj === null) {
        objs.covobj = getJson('/VGV/ncov/postdata'+argus);
        for(let covobj of objs.covobj){    //解析不同碱基的序列化字符串，如"13 T 14_190 - 192 A 199-2228 N"
            covobj.difbase={}
            if(covobj.sequence!=='?'&& covobj.sequence!==null){
                let seqli=covobj.sequence.split(' ');
                for(let i=0;i<seqli.length-1;i++){
                    if(seqli[i].indexOf("_")===-1){
                        covobj.difbase[seqli[i]]=seqli[i+1];
                    }else{
                        for(let j=Number(seqli[i].split('_')[0]);j<=Number(seqli[i].split('_')[1]);j++){
                            covobj.difbase[j]=seqli[i+1];
                        }
                    }
                }
            }
        }
    }
    if (objs.seqobj === null) {
        objs.seqobj = getJson('/VGV/track/NC_045512.2/seq.json');
    }
    if (objs.claobj === null) {
        objs.claobj = getJson('/VGV/track/clades.json');
    }
    if(speInfo===null) speInfo = getJson('/VGV/track/NC_045512.2/info.json');
    if (urlInfo === null) {
        urlInfo = {
            spe: "NC_045512.2",
            chr: "0",
            start: 1,
            end: speInfo.seq_len,
            trk: "0",
            len: function () {
                return this.end - this.start + 1;
            }
        };
        setIcon("toleft",urlInfo.start<=1);
        setIcon("toright",urlInfo.end>=speInfo.seq_len);
        setIcon("zoomin",urlInfo.len()<=25);
        setIcon("zoomout",urlInfo.len()>=speInfo.seq_len);
        backstack.push($.extend(true,{},urlInfo));
    }
    redraw();
    $('#ncovTree').html("");
    d3.selectAll("#ncovTree circle").remove()
    let height = 15; //画布的高度
    const rwidth = width / urlInfo.len();
    let rheight = 15;
    $("#tratab").html('<tbody></tbody>')
    var svg_list = []
    var seqs_all = objs.covobj.length
    var vertex_tmp = vertex
    ncovTree();
    $("#tratab").append($('<tr style="display: table-row;"><td style="width:180px;">Reference</td><td id="seq' + 'ref' + '"></td></tr>'))
    var svg = addMovableSvg("#seq" + 'ref',width,height);
    svg_list.push(svg)
    for (let sp = (pageconfig[0]-1)*pageconfig[1]; sp < Math.min(pageconfig[0]*pageconfig[1],seqs_all); sp++) {
        let name = objs.covobj[sp].strain;
        let title = name;
        name = name.split('/')[1]+'/'+name.split('/')[2];
        if(name.length>16) name=name.substr(0,13)+'...';
        $("#tratab").append($('<tr style="display: table-row;"><td ' + 'title="' + title + '" style="width:190px;">' + name + '</td><td id="seq' + sp + '"></td></tr>'))
        var svg = addMovableSvg("#seq" + sp,width,height);
        svg_list.push(svg)
    }
    $("#tratab").append($('<tr style="display: table-row;"><td style="width:190px;">Sequence Diversity</td><td id="seq' + 'div' + '"></td></tr>'))
    addMovableSvg("#seq" + 'div',width,3*height);
    $("#tratab").append($('<tr style="display: table-row;"><td style="width:190px;">Mutation Frequency</td><td id="seq' + 'fre' + '"></td></tr>'))
    addMovableSvg("#seq" + 'fre',width,3*height);
    //绘制碱基序列
    for (let j = drawleft; j < drawright + 1; j++) { //注意左闭右开
        let diversity={'A':0,'C':0,'T':0,'G':0,'other':0};
        let mutations=0;
        let allcla=seqs_all;
        for (let i = -1; i < seqs_all; i++) {       //i为-1为参考序列，否则为其他cov序列
            let base = objs.seqobj.seq[j];
            let opacity = ".3";
            if (i == -1) opacity = "1";
            else {
                if (objs.covobj[i].difbase.hasOwnProperty(j + 1)) {
                    base = objs.covobj[i].difbase[j + 1];
                    opacity = "1";
                    if (base == 'A' || base == 'C' || base == 'G' || base == 'T') {
                        mutations += 1;
                    }
                }
            }
            if (diversity.hasOwnProperty(base)) {
                diversity[base] += 1;
            } else if (base === 'N' || base.length > 1) {           //N不计算在内
                allcla--;
            } else {
                diversity['other'] += 1;
            }
            if(i===-1||(i>= (pageconfig[0]-1)*pageconfig[1] &&i < Math.min(pageconfig[0]*pageconfig[1],seqs_all))){
                i_copy=i===-1?-1:i-(pageconfig[0]-1)*pageconfig[1];
                if (urlInfo.len() < 300) {
                    var rect = svg_list[i_copy + 1]
                        .append("rect") //添加一个矩形
                        .attr("x", vertex_tmp)
                        .attr("y", 0)
                        .attr("width", rwidth)
                        .attr("height", rheight)
                        .attr("fill", basecolor[base])
                        .attr("stroke", "black")
                        .attr("stroke-width", .1)
                        .attr("opacity", opacity)
                    if (base.length > 1) {
                        rect.attr("fill", "#b419d9")
                            .attr("cursor", "pointer")
                            .on("click", function () {
                                alert("Insert: " + objs.claobj[cla].claCov.difbase[j + 1]);
                            })
                    }
                } else if (base !== objs.seqobj.seq[j] && base !== 'N') {
                    var rect = svg_list[i_copy + 1].append("rect") //添加一个矩形
                        .attr("x", vertex_tmp)
                        .attr("y", 0)
                        .attr("width", Math.max(rwidth, 1.5))
                        .attr("height", rheight)
                        .attr("fill", basecolor[base])
                    if (base.length > 1) {
                        rect.attr("fill", "#b419d9")
                    }
                }
                if (urlInfo.len() < 120 && opacity === '1') {
                    var text = svg_list[i_copy + 1]
                        .append('text')
                        .text(base)
                        .attr('fill', 'black')
                        .attr('x', vertex_tmp)
                        .attr('y', 0)
                        .attr('text-anchor', 'middle')
                        .style('font-size', 12)
                        .attr('dx', rwidth / 2)
                        .attr('dy', rheight / 1.25)
                    if (base.length > 1) {
                        text.text(base.length)
                            .attr("cursor", "pointer")
                            .on("click", function () {
                                alert("Insert: " + objs.claobj[cla].claCov.difbase[j + 1]);
                            })
                    }
                }
            }
        }
        let entropy=0;
        for(let key in diversity){
            if(diversity[key]>0) {
                entropy += (-Math.log(diversity[key] / allcla) * diversity[key] / allcla);
            }
        }
        let max_entropy=Math.log(5);  //香农熵的最大值
        if(entropy>0) {
            var rect = d3.select("#seq" + "div" + " svg")
                .append("rect")
                .attr("x", vertex_tmp)
                .attr("y", 3*rheight * (1 - entropy / max_entropy))
                .attr("width", Math.max(rwidth, 1.5))
                .attr("height", 3*rheight * entropy / max_entropy)
                .attr("fill", "#047d35")
        }
        if(mutations>0) {
            var cir = d3.select("#seq" + "fre" + " svg")
                .append("circle")
                .attr("cx", vertex_tmp + Math.max(rwidth, 2)/2)
                .attr("cy", (3*rheight-6) * (1 - mutations / allcla)+3)
                .attr("r", 2)
                .attr("stroke", "#c108ea")
                .attr("stroke-width", .8)
                .attr("fill", "#ffffff")
        }
        vertex_tmp += rwidth
    }

    var h3 = document.querySelector("#speinfo")
    h3.innerHTML = 'SARS-CoV-2 Evolution : '+objs.covobj.length+' Strains Selected';
    // if($("#covtab").html()==='')
    //     for(let i=0;i<seqs_all;i++){
    //         $("#covtab").append("<tr>"+"<th scope=\"row\">"+i+"</th>"+"<td>"+objs.covobj[i].strain+"</td>"+"<td>"+objs.covobj[i].gisaid_epi_isl+"</td>"+"<td>"+new Date(objs.covobj[i].date).toLocaleDateString()+"</td>"+"<td>"+objs.covobj[i].region+"</td>"+"<td>"+objs.covobj[i].country+"</td>"+"<td>"+objs.covobj[i].division+"</td>"+"<td>"+objs.covobj[i].length+"</td>"+"<td>"+objs.covobj[i].nextstrain_clade+"</td>"+"</tr>")
    //     }

    if($('#covtab').text()===''||$('#covtab').attr("mode")==="pack"){
        addCovTable(objs.covobj);
        $('#covtab').attr("mode","full");
    }
    else $('#covtab').bootstrapTable('load', objs.covobj);
}


//新冠病毒序列文件track绘制__pack模式
function covPackTrack(newDate) {
    let argus = url.split("/ncov")[1];
    if (objs.covobj === null) {
        objs.covobj = getJson('/VGV/ncov/postdata'+argus);
        for(let covobj of objs.covobj){    //解析不同碱基的序列化字符串，如"13 T 14_190 - 192 A 199-2228 N"
            covobj.difbase={}
            if(covobj.sequence!=='?'&& covobj.sequence!==null){
                let seqli=covobj.sequence.split(' ');
                for(let i=0;i<seqli.length-1;i++){
                    if(seqli[i].indexOf("_")===-1){
                        covobj.difbase[seqli[i]]=seqli[i+1];
                    }else{
                        for(let j=Number(seqli[i].split('_')[0]);j<=Number(seqli[i].split('_')[1]);j++){
                            covobj.difbase[j]=seqli[i+1];
                        }
                    }
                }
            }
        }
    }
    if (objs.seqobj === null) {
        objs.seqobj = getJson('/VGV/track/NC_045512.2/seq.json');
    }
    if (objs.claobj === null) {
        objs.claobj = getJson('/VGV/track/clades.json');
    }
    if(speInfo===null) speInfo = getJson('/VGV/track/NC_045512.2/info.json');
    if (urlInfo === null) {
        urlInfo = {
            spe: "NC_045512.2",
            chr: "0",
            start: 1,
            end: speInfo.seq_len,
            trk: url.split("&track=")[1],
            len: function () {
                return this.end - this.start + 1;
            }
        };
        setIcon("toleft",urlInfo.start<=1);
        setIcon("toright",urlInfo.end>=speInfo.seq_len);
        setIcon("zoomin",urlInfo.len()<=25);
        setIcon("zoomout",urlInfo.len()>=speInfo.seq_len);
        backstack.push($.extend(true,{},urlInfo));
    }
    redraw();

    $('#ncovTree').html("");

    var trks = urlInfo.trk.split('+')
    for(let cla in objs.claobj){
        cla["exist"]=false;
        if(trks.indexOf(cla.substr(0,3))!==-1) objs.claobj[cla].display=true;
        else objs.claobj[cla].display=false;
    }

    let height = 15; //画布的高度
    const rwidth = width / urlInfo.len();
    let rheight = 15;
    $("#tratab").html('<tbody></tbody>')
    $("#tratab").append($('<tr style="display: table-row;"><td id="nm'+'ref'+'" style="width:190px;">Reference</td><td id="seq' + 'ref' + '"></td></tr>'))
    addMovableSvg("#seq" + "ref",width,height);
    for(let cla in objs.claobj){
        objs.claobj[cla]["claCov"] = null;
        if(objs.claobj[cla].display) {
            claID = cla.replace(/[\(\)\.,\/ ]/g, "");
            $("#tratab").append($('<tr style="display: table-row;"><td id="nm' + claID + '" style="width:190px;">' + cla + ': -' + '</td><td id="seq' + claID + '"></td></tr>'))
            $('#nm' + claID).css("color", "#aaaaaa");
            addMovableSvg("#seq" + claID, width, height);
        }
    }
    $("#tratab").append($('<tr style="display: table-row;"><td style="width:190px;">Sequence Diversity</td><td id="seq' + 'div' + '"></td></tr>'))
    addMovableSvg("#seq" + 'div',width,3*height);
    $("#tratab").append($('<tr style="display: table-row;"><td style="width:190px;">Mutation Frequency</td><td id="seq' + 'fre' + '"></td></tr>'))
    addMovableSvg("#seq" + 'fre',width,3*height);
    for(let cov of objs.covobj){
        if(objs.claobj.hasOwnProperty(cov.nextstrain_clade)&&(objs.claobj[cov.nextstrain_clade].display)&&((objs.claobj[cov.nextstrain_clade]["claCov"]===null||objs.claobj[cov.nextstrain_clade]["claCov"].date<cov.date)&&newDate>=cov.date)){
            objs.claobj[cov.nextstrain_clade]["claCov"]=cov;
        }
        objs.claobj[cov.nextstrain_clade]["exist"]=true;
    }
    ncovTree();
    let tabdata=[];
    for(let cla in objs.claobj) {
        if (objs.claobj[cla]["claCov"] !== null) {
            tabdata.push(objs.claobj[cla]["claCov"]);
            let dt=new Date(objs.claobj[cla]["claCov"].date);
            let claID=cla.replace(/[\(\)\.,\/ ]/g,"");
            $("#nm"+claID).html(cla.replace(/\s*/g,"")+': '+(dt.getFullYear()-2000) + "/"+ (dt.getMonth() + 1) + "/" + dt.getDate()).attr('title', cla+' '+objs.claobj[cla]["claCov"].strain+' '+dt.toLocaleDateString());
            $('#nm'+claID).css("color","");
        }
        if(!objs.claobj[cla]["exist"]) $("#setrk option[value="+cla.substr(0,3)+"]").attr("disabled",true);
    }
    $("#setrk").selectpicker('val', trks)
    //绘制碱基序列
    var vertex_tmp = vertex
    for (let j = drawleft; j < drawright + 1; j++) { //注意左闭右开
        let base=objs.seqobj.seq[j];
        let opacity="1";
        if (urlInfo.len() < 300) {              //参考碱基绘制
            var rect = d3.select("#seq"+"ref"+" svg")
                .append("rect") //添加一个矩形
                .attr("x", vertex_tmp)
                .attr("y", 0)
                .attr("width", rwidth)
                .attr("height", rheight)
                .attr("fill", basecolor[base])
                .attr("stroke", "black")
                .attr("stroke-width", .1)
                .attr("opacity",opacity)
        }
        if (urlInfo.len() < 120) {
            var text = d3.select("#seq"+"ref"+" svg")
                .append('text')
                .text(base)
                .attr('fill', 'black')
                .attr('x', vertex_tmp)
                .attr('y', 0)
                .attr('text-anchor', 'middle')
                .style('font-size', 12)
                .attr('dx', rwidth / 2)
                .attr('dy', rheight / 1.25)
        }
        let diversity={'A':0,'C':0,'T':0,'G':0,'other':0};
        let mutations=0;
        let allcla=0;
        for (let cla in objs.claobj) {
            base=objs.seqobj.seq[j];
            opacity=".3";
            if(objs.claobj[cla].claCov===null){
                continue;
            }else{
                allcla+=1;
            }
            if(objs.claobj[cla].claCov.difbase.hasOwnProperty(j+1)){
                base=objs.claobj[cla].claCov.difbase[j+1];
                opacity="1";
                if(base=='A'||base=='C'||base=='G'||base=='T') {
                    mutations += 1;
                }
            }
            if(diversity.hasOwnProperty(base)){
                diversity[base]+=1;
            }else if(base==='N'||base.length>1){           //N和插入突变不计算在内
                allcla--;
            }else{
                diversity['other']+=1;
            }
            claID=cla.replace(/[\(\)\.,\/ ]/g,"");
            if (urlInfo.len() < 300) {
                var rect = d3.select("#seq"+claID+" svg")
                    .append("rect") //添加一个矩形
                    .attr("x", vertex_tmp)
                    .attr("y", 0)
                    .attr("width", rwidth)
                    .attr("height", rheight)
                    .attr("fill", basecolor[base])
                    .attr("stroke", "black")
                    .attr("stroke-width", .1)
                    .attr("opacity",opacity)
                if(base.length>1){
                    rect.attr("fill", "#b419d9")
                        .attr("cursor", "pointer")
                        .on("click", function () {
                            alert("Insert: "+objs.claobj[cla].claCov.difbase[j+1]);
                        })
                }
            } else if(base!==objs.seqobj.seq[j] &&base!=='N'){
                var rect = d3.select("#seq"+claID+" svg")
                    .append("rect") //添加一个矩形
                    .attr("x", vertex_tmp)
                    .attr("y", 0)
                    .attr("width", Math.max(rwidth,1.5))
                    .attr("height", rheight)
                    .attr("fill", basecolor[base])
                if(base.length>1){
                    rect.attr("fill", "#b419d9")
                }
            }
            if (urlInfo.len() < 120&&base!==objs.seqobj.seq[j]) {
                var text = d3.select("#seq"+claID+" svg")
                    .append('text')
                    .text(base)
                    .attr('fill', 'black')
                    .attr('x', vertex_tmp)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .style('font-size', 12)
                    .attr('dx', rwidth / 2)
                    .attr('dy', rheight / 1.25)
                if(base.length>1){
                    text.text(base.length)
                        .attr("cursor", "pointer")
                        .on("click", function () {
                            alert("Insert: "+objs.claobj[cla].claCov.difbase[j+1]);
                        })
                }
            }
            /*
            if(objs.claobj[cla].hasOwnProperty(j+1)) {          //clade定义标识
                var cir = d3.select("#seq" + claID + " svg")
                    .append("circle") //添加一个矩形
                    .attr("cx", vertex_tmp + Math.max(rwidth, 1.5) / 2)
                    .attr("cy", rheight / 2)
                    .attr("r", Math.max(rwidth, 1.5) * 2)
                    .attr("fill", basecolor[objs.claobj[cla][j+1]])
            }*/
        }
        let entropy=0;
        for(let key in diversity){
            if(diversity[key]>0) {
                entropy += (-Math.log(diversity[key] / allcla) * diversity[key] / allcla);
            }
        }
        let max_entropy=Math.log(5);  //香农熵的最大值
        if(entropy>0) {
            var rect = d3.select("#seq" + "div" + " svg")
                .append("rect")
                .attr("x", vertex_tmp)
                .attr("y", 3*rheight * (1 - entropy / max_entropy))
                .attr("width", Math.max(rwidth, 1.5))
                .attr("height", 3*rheight * entropy / max_entropy)
                .attr("fill", "#047d35")
        }
        if(mutations>0) {
            var cir = d3.select("#seq" + "fre" + " svg")
                .append("circle")
                .attr("cx", vertex_tmp + Math.max(rwidth, 2)/2)
                .attr("cy", (3*rheight-6) * (1 - mutations / allcla)+3)
                .attr("r", 2)
                .attr("stroke", "#c108ea")
                .attr("stroke-width", .8)
                .attr("fill", "#ffffff")
        }
        vertex_tmp += rwidth
    }

    var h3 = document.querySelector("#speinfo")
    h3.innerHTML = 'SARS-CoV-2 Evolution : '+objs.covobj.length+' Strains Selected';
    // if($("#covtab").html()==='')
    //     for(let i=0;i<seqs_all;i++){
    //         $("#covtab").append("<tr>"+"<th scope=\"row\">"+i+"</th>"+"<td>"+objs.covobj[i].strain+"</td>"+"<td>"+objs.covobj[i].gisaid_epi_isl+"</td>"+"<td>"+new Date(objs.covobj[i].date).toLocaleDateString()+"</td>"+"<td>"+objs.covobj[i].region+"</td>"+"<td>"+objs.covobj[i].country+"</td>"+"<td>"+objs.covobj[i].division+"</td>"+"<td>"+objs.covobj[i].length+"</td>"+"<td>"+objs.covobj[i].nextstrain_clade+"</td>"+"</tr>")
    //     }

    if($('#covtab').text()===''||$('#covtab').attr("mode")==="full"){
        addCovTable(tabdata);
        $('#covtab').attr("mode","pack");
    }
    else $('#covtab').bootstrapTable('load', tabdata);

}

//进化树绘制
/*
function ncovTree(time,record){
    let tm2px=50000000;  //时间戳映射到像素的除数
    let clanm=["19A","19B","20A","20B","20C","20D","20E (EU1)","20F","20G","20H/501Y.V2","20I/501Y.V1","20J/501Y.V3","21A"] //分支名
    let clacl=["rgb(85, 43, 201)","rgb(71, 84, 229)","rgb(75, 129, 233)","rgb(87, 165, 216)","rgb(105, 190, 185)","rgb(131, 205, 148)","rgb(161, 213, 116)","rgb(195, 214, 92)","rgb(227, 210, 77)","rgb(250, 191, 68)","rgb(255, 157, 60)","rgb(255, 109, 51)","rgb(249, 53, 41)"]
    let clastcl=["rgb(75, 38, 177)","rgb(63, 74, 202)","rgb(66, 114, 206)","rgb(77, 146, 191)","rgb(93, 168, 163)","rgb(116, 181, 131)","rgb(142, 188, 102)","rgb(172, 189, 81)","rgb(200, 185, 68)","rgb(221, 169, 60)","rgb(230, 139, 53)","rgb(227, 96, 45)","rgb(220, 47, 36)"]  //边缘颜色
    let claft=[1577289600000,1579795200000,1581177600000,1582732800000,1582646400000,1584806400000,1592582400000,1591286400000,1595606400000,1598889600000,1607529600000,1608480000000,1613404800000]   //每个分支的初始时间戳
    if(time===0){
        d3.select("#g" + record.nextstrain_clade.replace(/[\(\)\.,\/ ]/g, ""))
            .append("circle")
            .attr("cx", (record.date-claft[clanm.indexOf(record.nextstrain_clade)])/tm2px)
            .attr("cy", 0)
            .attr("r", 5)
            .attr("fill", clacl[clanm.indexOf(record.nextstrain_clade)])
            .attr("stroke", clastcl[clanm.indexOf(record.nextstrain_clade)])
            .attr("stroke-width", "1.5")
            .attr("transform", "translate(0,0)")
            .attr("cursor", "pointer")
            .on("click", function () {
                let e = event || window.event
                mask.style.display = "block";
                let div = document.createElement("div");
                document.body.appendChild(div);
                div.className = "emergediv";
                div.style.top = e.pageY-300 + "px";
                let table=document.createElement("table");
                table.className = "table table-striped";
                tabinhtml=''
                for(let key in record){
                    if(key=='date'||key=='date_submitted')
                        tabinhtml=tabinhtml+'<tr><td style="white-space:nowrap;">'+key.replaceAll("_"," ")+'</td>'+'<td>'+new Date(record[key]).toLocaleDateString()+'</td></tr>';
                    else if(record[key]!=="?"&&key!=="difbase"&&key!=="sequence")
                        tabinhtml=tabinhtml+'<tr><td style="white-space:nowrap;">'+key.replaceAll("_"," ")+'</td>'+'<td>'+record[key]+'</td></tr>';
                }
                table.innerHTML=tabinhtml;
                div.appendChild(table);
            })
    } else {  //初始化
        let padd=25; //两分支间距基数
        let marl=30;  //第一个g距离svg左端距离
        let clay=[1,2,3,6,11,10,5,9,13,12,8,7,4]  //分支距离顶部距离
        let clacn=[0,1,1,3,8,4,2,3,2,1,2,1,1] //与父分支的联系距离
        var svg = d3.select("#ncovTree")
            .append("svg")
            .attr("width", 1100)
            .attr("height", 340)
        let sortList=[]
        for(let i = 0; i < clanm.length; i++) {      //为了防止节点被竖连接线遮挡，按照时间从晚到早绘制，因此给下标排个序
            sortList.push([i,claft[i]]);
        }
        sortList.sort(function (a,b) {   //降序
            return b[1]-a[1];
        })
        for (let j = 0; j < clanm.length; j++) {
            let i=sortList[j][0];
            let g = svg.append("g")
                .attr("id", "g" + clanm[i].replace(/[\(\)\.,\/ ]/g, ""))
                .attr("transform", "translate(" + (marl + (claft[i] - mintime) / tm2px) + "," + clay[i] * padd + ")")
            g.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (Math.max(time,claft[i]) - claft[i]) / tm2px)
                .attr("y2", 0)
                .attr("stroke", clacl[i])
                .attr("stroke-width", "2px")
                .attr("stroke-opacity", ".9");
            g.append("line")
                .attr("x1", (Math.max(time,claft[i]) - claft[i]) / tm2px)
                .attr("y1", 0)
                .attr("x2", (maxtime - claft[i]) / tm2px)
                .attr("y2", 0)
                .attr("stroke", clacl[i])
                .attr("stroke-width", "2px")
                .attr("stroke-opacity", ".3");
            svg.append("line")
                .attr("x1", marl + (claft[i] - mintime) / tm2px)
                .attr("y1", (clay[i] - clacn[i]) * padd)
                .attr("x2", marl + (claft[i] - mintime) / tm2px)
                .attr("y2", clay[i] * padd)
                .attr("stroke", clacl[i])
                .attr("stroke-width", "2px")
                .attr("stroke-opacity", time<claft[i]?".3":".9");
            g.append('text')
                .text(clanm[i])
                .attr('fill', '#787676')
                .attr('x', (maxtime - claft[i]) / tm2px + 10)
                .attr('y', 6)
                .style('font-size', 15)
                .style('font-weight', 'bold')
        }
        if(time<maxtime) {
            svg.append("line")
                .attr("x1", marl + (time - mintime) / tm2px)
                .attr("y1", 10)
                .attr("x2", marl + (time - mintime) / tm2px)
                .attr("y2", 340)
                .attr("stroke", "#891b88")
                .attr("stroke-dasharray","4,4")
                .attr("stroke-width", "2px")
                .attr("stroke-opacity", ".3");
        }
    }
}
*/
function ncovTree(){
    let records=[];
    let time=packconfig[0]==0?packconfig[1]:maxtime;
    let tm2px=55000000;  //时间戳映射到像素的除数
    let sortList=sortClades("19A"); //上下顺序排序的进化枝名。原理：兄弟结点依据出现时间倒序排序，对树先序遍历
    if(packconfig[0]==0){
        for(let cla in objs.claobj){
            if(objs.claobj[cla].claCov!==null) records.push(objs.claobj[cla].claCov);
        }
        for (let j = sortList.length-1; j >=0 ; j--) {  //pack模式下sortList删除自己和子树中均无节点的进化枝
            if(objs.claobj[sortList[j]]["claCov"]!=null) continue;
            else{
                let index=objs.claobj[sortList[j]]["children"].length-1;
                for(;index>=0;index--) if(sortList.indexOf(objs.claobj[sortList[j]]["children"][index])!=-1) break;
                if(index===-1) sortList.splice(j,1);
            }
        }
    }else records=objs.covobj;
    let padd = 25; //两分支间距基数
    let marl = 30;  //第一个g距离svg左端距离
    let svg = d3.select("#ncovTree")
            .append("svg")
            .attr("width", width + 200)
            .attr("height", padd * sortList.length + 15);

    for (let j = sortList.length-1; j >=0 ; j--) {     //首先绘制树干,绘制时先画子进化枝，使其在下，父节点如果在交叉处不会被挡住
        let clade=objs.claobj[sortList[j]];
        let verLen=j-(clade.parents===""?0:sortList.indexOf(clade.parents));  //与父分支的垂直距离
        let g = svg.append("g")
            .attr("id", "g" + sortList[j].replace(/[\(\)\.,\/ ]/g, ""))
            .attr("transform", "translate(" + (marl + (clade.firstTime - mintime) / tm2px) + "," + (j+1) * padd + ")")
        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (Math.max(time,clade.firstTime) - clade.firstTime) / tm2px)
            .attr("y2", 0)
            .attr("stroke", clade.color)
            .attr("stroke-width", "2px")
            .attr("stroke-opacity", ".9");
        g.append("line")
            .attr("x1", (Math.max(time,clade.firstTime) - clade.firstTime) / tm2px)
            .attr("y1", 0)
            .attr("x2", (maxtime - clade.firstTime) / tm2px)
            .attr("y2", 0)
            .attr("stroke", clade.color)
            .attr("stroke-width", "2px")
            .attr("stroke-opacity", ".3");
        svg.append("line")
            .attr("x1", marl + (clade.firstTime - mintime) / tm2px)
            .attr("y1", ((j+1) - verLen) * padd)
            .attr("x2", marl + (clade.firstTime - mintime) / tm2px)
            .attr("y2", (j+1) * padd)
            .attr("stroke", clade.color)
            .attr("stroke-width", "2px")
            .attr("stroke-opacity", time<clade.firstTime?".3":".9");
        g.append('text')
            .text(sortList[j])
            .attr('fill', '#787676')
            .attr('x', (maxtime - clade.firstTime) / tm2px + 10)
            .attr('y', 6)
            .style('font-size', 15)
            .style('font-weight', 'bold')
    }
    if(packconfig[0]==0) {
        svg.append("line")
            .attr("x1", marl + (time - mintime) / tm2px)
            .attr("y1", 10)
            .attr("x2", marl + (time - mintime) / tm2px)
            .attr("y2", padd * sortList.length + 15)
            .attr("stroke", "#891b88")
            .attr("stroke-dasharray","4,4")
            .attr("stroke-width", "2px")
            .attr("stroke-opacity", ".3");
    }
    for(let record of records){
        d3.select("#g" + record.nextstrain_clade.replace(/[\(\)\.,\/ ]/g, ""))
            .append("circle")
            .attr("cx", (record.date-objs.claobj[record.nextstrain_clade].firstTime)/tm2px)
            .attr("cy", 0)
            .attr("r", 5)
            .attr("fill", objs.claobj[record.nextstrain_clade].color)
            .attr("stroke", objs.claobj[record.nextstrain_clade].strokeColor)
            .attr("stroke-width", "1.5")
            .attr("transform", "translate(0,0)")
            .attr("cursor", "pointer")
            .on("click", function () {
                let e = event || window.event
                mask.style.display = "block";
                let div = document.createElement("div");
                document.body.appendChild(div);
                div.className = "emergediv";
                div.style.top = e.pageY-300 + "px";
                let table=document.createElement("table");
                table.className = "table table-striped";
                tabinhtml=''
                for(let key in record){
                    if(key=='date'||key=='date_submitted')
                        tabinhtml=tabinhtml+'<tr><td style="white-space:nowrap;">'+key.replaceAll("_"," ")+'</td>'+'<td>'+new Date(record[key]).toLocaleDateString()+'</td></tr>';
                    else if(record[key]!=="?"&&key!=="difbase"&&key!=="sequence")
                        tabinhtml=tabinhtml+'<tr><td style="white-space:nowrap;">'+key.replaceAll("_"," ")+'</td>'+'<td>'+record[key]+'</td></tr>';
                }
                table.innerHTML=tabinhtml;
                div.appendChild(table);
            })
    }

}

function sortClades(node){
    let sortList=[node];
    if(objs.claobj[node]["children"].length!==0) {
        objs.claobj[node]["children"].sort(function (a, b) {   //降序
            return objs.claobj[b].firstTime - objs.claobj[a].firstTime;
        });
        for (let cla of objs.claobj[node]["children"]) {
            sortList = sortList.concat(sortClades(cla));
        }
    }
    return sortList;
}

function addCovTable(data){
    $('#covtabParent').html('<table id="covtab" class="table table-hover"></table>');
    $('#covtab').bootstrapTable({
        pagination: packconfig[0]===1?true:false,  //是否显示分页(*)
        pageSize: 10,                        //每页的记录行数(*)
        pageList: [10, 25, 50],        //可供选择的每页的行数(*)
        onPageChange(number,size){
            pageconfig = [number, size];
            vertex = 0;
            reset();
        },
        onClickRow:function(row, $element, field)
        {
            let e = event || window.event
            mask.style.display = "block";
            let div = document.createElement("div");
            document.body.appendChild(div);
            div.className = "emergediv";
            div.style.top = e.pageY-300 + "px";
            let table=document.createElement("table");
            table.className = "table table-striped";
            tabinhtml=''
            for(let key in row){
                if(key=='date'||key=='date_submitted')
                    tabinhtml=tabinhtml+'<tr><td style="white-space:nowrap;">'+key.replaceAll("_"," ")+'</td>'+'<td>'+new Date(row[key]).toLocaleDateString()+'</td></tr>';
                else if(row[key]!=="?"&&key!=="difbase"&&key!=="sequence")
                    tabinhtml=tabinhtml+'<tr><td style="white-space:nowrap;">'+key.replaceAll("_"," ")+'</td>'+'<td>'+row[key]+'</td></tr>';
            }
            table.innerHTML=tabinhtml;
            div.appendChild(table);
        },
        columns: [{
            field: 'nextstrain_clade',
            title: 'Nextstrain Clade',
        },{
            field: 'strain',
            title: 'Virus name',
        }, {
            field: 'gisaid_epi_isl',
            title: 'GISAID ID',
        },{
            field: 'pango_lineage',
            title: 'Pango Lineage',
        }, {
            field: 'date',
            title: 'Collection Date',
            formatter: function(value, row, index){return new Date(value).toLocaleDateString()},
        },{
            field: 'region',
            title: 'Region',
        },{
            field: 'country',
            title: 'Country',
        },{
            field: 'division',
            title: 'Division',
        } ],
        data:data,
    });
    $("#covtab").css("white-space","nowrap");
}

//参考基因track绘制
function refTrack() {
    if (objs.refobj === null) {
        objs.refobj = getJson('/VGV/track/' + urlInfo.spe + '/refseq.json');
    }
    var height = 25; //画布的高度
    var rwidth = width / urlInfo.len();
    var svg = addMovableSvg("#ref",width,height);
    var line_right = [] //记录每一行最右非空的位置
    var gene_num1 = 0 //记录每个gene唯一序号
    for (let gene of objs.refobj.annos) {
        if (gene.feature === "gene") {
            var ins = parseInt(gene.start)
            var ine = parseInt(gene.end)
            if (ins <= drawright + 1 && ine >= drawleft + 1) { //如果可视化范围内有该基因的部分,注意drawleft及drawleft是以0开头的！（对应以0开头的序列数组）
                var dstart = Math.max(vertex, vertex + (ins - drawleft - 1) * rwidth) //基因左端位置
                var dwidth = Math.min((ine - Math.max(ins, drawleft + 1) + 1) * rwidth, 2 * width - dstart) //基因长度
                gene.gene_num = gene_num1
                var g = svg.append("g").attr("cursor", "pointer").on("click", function () {
                    divEmerge(gene, "gene")
                })
                gene_num1++
                var rect = g.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", dwidth)
                    .attr("height", 10)
                    .attr("fill", "#7A378B")
                if (dwidth > 8) { //添加正链箭头标识
                    for (var i = 3; i <= dwidth - 5; i += 15) {
                        g.append("polyline")
                            .attr("points", gene.strand === '-' ? ((i + 5) + ",1," + i + ",5," + (i + 5) + ",9") : (i + ",1," + (i + 5) + ",5," + i + ",9"))
                            .attr("fill", "none")
                            .attr("stroke", "white")
                            .attr("stroke-width", "1.5")
                            .attr("transform", "translate(0,0)")
                    }
                }
                var geneText = ''
                if (urlInfo.len() < 100000) {
                    geneText = gene.attributes.Name
                } //显示基因名的条件
                var text = g.append('text') //获取基因名
                    .text(geneText)
                    .attr('fill', '#7A378B')
                    .attr('x', 0)
                    .attr('y', 12) //注意text的（x,y）对应文字左下角
                    .style('font-size', 15)
                    .style('font-weight', 'bold')
                    .style('font-style', 'italic')
                var textwidth = text.node().getBBox().width //基因名长度
                g.select("text") //基因名放到左侧
                    .attr("dx", -textwidth - 2)
                    .attr("dy", "0")
                var unset = true
                var i = 0
                if ((dstart - textwidth < 0) && (dstart + dwidth > 0)) { //如果基因及名称横跨了视野左边界线，将名称调整到基因下面
                    for (; i < line_right.length - 1; i++) {
                        if ((line_right[i] < dstart) && (line_right[i + 1] < 0)) { //寻找符合条件的相邻的两行
                            g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                            text.attr("x", -dstart + 2)
                                .attr("dx", "0")
                                .attr("dy", 20)
                            line_right[i] = dstart + dwidth
                            line_right[i + 1] = 2 + textwidth
                            unset = false
                            break
                        }
                    }
                    if (unset) {
                        if ((line_right.length === 0)) {
                            line_right.push(dstart + dwidth)
                            svg.attr("height", height += 20)
                        } else if (line_right[i] > dstart) { //如果最下面一行可以放基因，就新增一行放名称
                            line_right.push(dstart + dwidth)
                            svg.attr("height", height += 20)
                            i++
                        } else {
                            line_right[i] = dstart + dwidth
                        }
                        line_right.push(2 + textwidth)
                        g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                        text.attr("x", -dstart + 2) //x设置为靠近视野左边界（注意x的值是text相对于g）
                            .attr("dx", "0")
                            .attr("dy", 20)
                        svg.attr("height", height += 20)
                    }
                } else { //根据各行最右端确定放置于哪一行
                    for (; i < line_right.length; i++) {
                        if (line_right[i] < dstart - textwidth - 4) {
                            g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                            line_right[i] = dstart + dwidth
                            unset = false
                            break
                        }
                    }
                    if (unset) {
                        line_right.push(dstart + dwidth)
                        g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                        svg.attr("height", height += 20)
                    }
                }
            }
        }
    }
}

//蛋白质序列track绘制
function proTrack() {
    if (objs.proobj === null) {
        objs.proobj = getJson('/VGV/track/' + urlInfo.spe + '/proseq.json');
    }
    var height = 25; //画布的高度
    var rwidth = width / urlInfo.len();
    var svg = addMovableSvg("#pro",width,height);
    var line_right = [] //记录每一行最右非空的位置
    for (let pro of objs.proobj.pros) {
        if (pro.start !== undefined) {
            var ins = parseInt(pro.start)
            var ine = parseInt(pro.end)
            if (ins <= drawright + 1 && ine >= drawleft + 1) { //如果可视化范围内有该蛋白质的部分
                var g = svg.append("g").attr("cursor", "pointer").on("click", function () {
                    divEmerge(pro, "pro")
                })
                var dstart = Math.max(vertex, vertex + (ins - drawleft - 1) * rwidth) //蛋白质左端位置
                var dwidth = Math.min((ine - Math.max(ins, drawleft + 1) + 1) * rwidth, 2 * width - dstart) //蛋白质长度
                if (urlInfo.len() < 300) { //长度符合显示氨基酸序列
                    var aligndrawleft = Math.max(ins + 3 * Math.ceil((drawleft + 1 - ins) / 3), ins) //离drawleft最近的氨基酸开始碱基或蛋白质最左氨基酸首碱基
                    var aligndrawright = Math.min(ins + 3 * Math.floor((drawright + 1 - ins) / 3), ine - 2) //离drawright最近的氨基酸开始碱基或蛋白质最右氨基酸首碱基
                    //注意aligndrawleft/right和drawleft/right不同，前者已经变成1-based了
                    var aaleft = (aligndrawleft - ins) / 3 //0-based,为和序列下标对应
                    var aaright = (aligndrawright - ins) / 3
                    var aboveg = (aligndrawleft - Math.max(drawleft + 1, ins)) * rwidth //g在后面会根据dstart移动，只需要算出第一个矩形相对于g的距离
                    var aacolor = {1: "#FFEC8B", 0: "#FFFFF0"}
                    var num = aaleft + 1 //双色
                    var newfirstaa = -1 //PRF处开始的新氨基酸序号
                    if (pro.PRF !== undefined) {
                        newfirstaa = (parseInt(pro.PRF) + 1 - ins) / 3 + 1
                        aaright = Math.ceil(aaright) //aaright需要向上取整
                        if (newfirstaa - 1 < aaleft) {
                            aboveg -= rwidth
                        }
                    }
                    for (let aa of pro.seq.substring(aaleft, aaright - 1 + 1)) { //注意左闭右开,0-based及且终止密码子不对应氨基酸
                        if (newfirstaa === num) {
                            aboveg -= rwidth
                        }
                        var rect = g.append("rect")
                            .attr("x", aboveg)
                            .attr("y", 0)
                            .attr("width", 3 * rwidth)
                            .attr("height", 15)
                            .attr("fill", aacolor[num % 2])
                            .attr("stroke", "black")
                            .attr("stroke-width", .1)
                        if (urlInfo.len() < 200) { //长度符合显示氨基酸简写
                            var textcontent = ((urlInfo.len() < 50) ? (aa + " " + num) : aa) //长度符合显示氨基酸序号
                            var text = g.append('text').text(textcontent).attr('fill', 'black')
                                .attr('x', aboveg)
                                .attr('y', 0)
                                .attr('text-anchor', 'middle')
                                .style('font-size', 12)
                                .style('fill', '#555555')
                                .attr('dx', 3 * rwidth / 2)
                                .attr('dy', 15 / 1.25)
                        }
                        aboveg += 3 * rwidth
                        num += 1
                    }
                } else {
                    var rect = g.append("rect")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", dwidth)
                        .attr("height", 10)
                        .attr("fill", "#CD950C")
                    if (dwidth > 5) {
                        for (var i = 7; i <= dwidth - 2; i += 15) {
                            g.append("circle")
                                .attr("cx", i)
                                .attr("cy", 5)
                                .attr("r", 2)
                                .attr("fill", "white")
                                .attr("stroke", "none")
                                .attr("transform", "translate(0,0)")
                        }
                    }
                }
                var proText = ''
                if (urlInfo.len() < 100000) {
                    proText = pro.name
                }
                var text = g.append('text') //获取蛋白质名
                    .text(proText)
                    .classed('movableText', true)
                    .attr('fill', '#CD950C')
                    .attr('x', 0)
                    .attr('y', 12) //注意text的（x,y）对应文字左下角
                    .style('font-size', 15)
                    .style('font-weight', 'bold')
                    .style('font-style', 'italic')
                var textwidth = text.node().getBBox().width
                g.select(".movableText")
                    .attr("dx", -textwidth - 2)
                    .attr("dy", "0")
                var unset = true
                var i = 0
                if ((dstart - textwidth < 0) && (dstart + dwidth > 0)) {
                    for (; i < line_right.length - 1; i++) {
                        if ((line_right[i] < dstart) && (line_right[i + 1] < 0)) {
                            g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                            text.attr("x", -dstart + 2)
                                .attr("dx", "0")
                                .attr("dy", 20)
                            line_right[i] = dstart + dwidth
                            line_right[i + 1] = 2 + textwidth
                            unset = false
                            break
                        }
                    }
                    if (unset) {
                        if ((line_right.length === 0)) {
                            line_right.push(dstart + dwidth)
                            svg.attr("height", height += 20)
                        } else if (line_right[i] > dstart) {
                            line_right.push(dstart + dwidth)
                            svg.attr("height", height += 20)
                            i++
                        } else {
                            line_right[i] = dstart + dwidth
                        }
                        line_right.push(2 + textwidth)
                        g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                        text.attr("x", -dstart + 2)
                            .attr("dx", "0")
                            .attr("dy", 20)
                        svg.attr("height", height += 20)
                    }
                } else {
                    for (; i < line_right.length; i++) {
                        if (line_right[i] < dstart - textwidth - 4) {
                            g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                            line_right[i] = dstart + dwidth
                            unset = false
                            break
                        }
                    }
                    if (unset) {
                        line_right.push(dstart + dwidth)
                        g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                        svg.attr("height", height += 20)
                    }
                }
            }
        }
    }
}

//将gff文件中蛋白质区域类型转化为HTML的id
function proTypeToId(type) {
    if (type === 'Signal peptide')
        return 'prosig'
    if (type === 'Transmembrane')
        return 'protra'
    if (type === 'Chain')
        return 'procha'
    if (type === 'Disulfide bond')
        return 'prodis'
    if (type === 'Sequence conflict')
        return 'procon'
    if (type === 'Repeat')
        return 'prorep'
    if (type === 'Region')
        return 'proreg'
    if (['Topological domain', 'Domain', 'Zinc finger'].includes(type))
        return 'prodom'
    if (['Glycosylation', 'Modified residue'].includes(type))
        return 'progly'
    if (['Mutagenesis', 'Natural variant'].includes(type))
        return 'promut'
    if (['Helix', 'Turn', 'Beta strand', 'Coiled coil'].includes(type))
        return 'prostr'
    return 'prooth'
}

//将gff文件中蛋白质区域类型转化为RGB颜色
function proTypeToRGB(type) {
    var tplen = type.length
    var rgbstr = '#'
    for (var i = 0; i < 6; i++)
        rgbstr += ((type[i % tplen].charCodeAt()) % 14).toString(16) //不%16防止太浅
    return rgbstr
}


//蛋白质区域track绘制
function promulTrack() {
    if (objs.domobj === null) {
        objs.domobj = getJson('/VGV/track/' + urlInfo.spe + '/prodomain.json');
    }
    var height = 10; //画布的高度
    var rwidth = width / urlInfo.len();
    var allidlist = ["proreg", "prosig", "protra", "procha", "prodom", "prodis", "progly", "promut", "prostr", "procon", "prorep", "prooth"]
    var idlist = []
    allidlist.forEach(function (e) {
        if (urlInfo.trk.indexOf(e) > -1) {
            idlist.push(e)
        }
    })
    idlist.forEach(function (e) {
        addMovableSvg('#' + e,width,height).attr("id", e + 'svg');
    });
    var line_right = new Array() //记录每一个track的每一行最右非空的位置
    var height_list = new Array()
    idlist.forEach(function (e) {
        line_right[e] = []
        height_list[e] = height
    })
    var promul_num1 = 0 //记录每个prodomain唯一序号
    for (let pro of objs.domobj.annos) {
        if (idlist.includes(proTypeToId(pro.feature))) {
            var ins = parseInt(pro.start)
            var ine = parseInt(pro.end)
            if (ins <= drawright + 1 && ine >= drawleft + 1) {
                var tpid = proTypeToId(pro.feature)
                var dstart = Math.max(vertex, vertex + (ins - drawleft - 1) * rwidth)
                var dwidth = Math.min((ine - Math.max(ins, drawleft + 1) + 1) * rwidth, 2 * width - dstart)
                pro.pro_num = promul_num1
                var svg = d3.select('#' + tpid + 'svg')
                var g = svg.append("g").attr("cursor", "pointer").on("click", function () {
                    divEmerge(pro, "prod")
                })
                promul_num1++
                var rect = g.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", dwidth)
                    .attr("height", 10)
                    .attr("fill", proTypeToRGB(pro.feature))
                /*if (dwidth > 8) {
                    for (var i = 3; i <= dwidth - 3; i += 15) {
                        g.append("circle")
                            .attr("cx", i)
                            .attr("cy", 5)
                            .attr("r",1)
                            .attr("fill", "white")
                            .attr("stroke", "none")
                            .attr("transform", "translate(0,0)")
                    }
                }*/
                var unset = true
                var i = 0
                for (; i < line_right[tpid].length; i++) {
                    if (line_right[tpid][i] < dstart + 0.5) {
                        g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                        line_right[tpid][i] = dstart + dwidth
                        unset = false
                        break
                    }
                }
                if (unset) {
                    line_right[tpid].push(dstart + dwidth)
                    g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                    svg.attr("height", height_list[tpid] += 20)
                }
            }
        }
    }
}

function gcpTrack() {
    var div = document.querySelector("#gcp");
    if (urlInfo.len() < 30000) {
        div.innerHTML = ''
        div.style.cursor = ""
        div.removeAttribute("onclick")
        gcpTrack1()
    } else {
        div.innerHTML = 'Zoom in to see GC percentage'
        div.style.cursor = "pointer"
        div.setAttribute("onclick", "zoomin()")
    }
}

function gcpTrack1() {
    if (objs.seqobj === null) {
        objs.seqobj = getJson('/VGV/track/' + urlInfo.spe + '/seq.json');
    }
    var height = 50; //画布的高度
    var rwidth = width / urlInfo.len();
    var rheight = 50;
    var vertex_tmp = vertex
    var svg = addMovableSvg("#gcp",width,height);
    var cnt = 0,
        gc_cnt = 0,
        step = 0,
        pct = 0
    if (urlInfo.len() < 301) { //碱基级分辨率直接在GC处绘制
        for (let base of objs.seqobj.seq.substring(drawleft, drawright + 1)) {
            var rect = svg.append("rect")
                .attr("x", vertex_tmp)
                .attr("y", 0)
                .attr("width", rwidth)
                .attr("height", rheight)
                .attr("fill", (base === "C" || base === "G") ? "#3A5FCD" : "#FFFFFF")
                .attr("stroke", "black")
                .attr("stroke-width", .1)
            vertex_tmp += rwidth
        }
    } else {
        step = Math.ceil(urlInfo.len() / 300) //展示300个矩形，分辨率足够且计算量小，step为一个矩形包含的碱基数
        drawleft_floor = Math.floor(drawleft / step) * step //每个矩形的起始碱基都要是step的倍数
        //var linedata = [] 折线图数据，但计算量大效率低
        for (var i = drawleft_floor; i < drawleft; ++i) {
            vertex_tmp -= rwidth
        }
        for (let base of objs.seqobj.seq.substring(drawleft_floor, drawright + 1)) {
            ++cnt
            if (base === "C" || base === "G") {
                ++gc_cnt
            }
            if (cnt % step === 0) {
                pct = gc_cnt / step
                gc_cnt = 0
                var rect = svg.append("rect")
                    .attr("x", vertex_tmp)
                    .attr("y", rheight * (1 - pct))
                    .attr("width", rwidth * step)
                    .attr("height", rheight * pct)
                    .attr("fill", "#3A5FCD")
                //linedata.push([vertex_tmp+rwidth/2,rheight*(1-pct)])
            }
            vertex_tmp += rwidth
            /*var lineGenerator = d3.line()
                          .x(function(d) {
                                return d[0]
                            })
                          .y(function(d) {
                                return d[1];
                           });
            svg.append('path')
                    .classed('curve', true)
                    .attr('stroke', '#000000')
                    .attr('stroke-width', '1')
                    .attr('fill', 'none')
                    .attr('d', lineGenerator.curve(d3['curveCardinal'])(linedata));*/
        }
    }
    /*var line_bottom = svg.append("line")
        .attr("x1", vertex)
        .attr("y1", height)
        .attr("x2", vertex_tmp)
        .attr("y2", height)
        .attr("stroke", "#555555")
        .attr("stroke-width", "2px");*/
}

//TRSs track绘制
function trsTrack() {
    if (objs.trsobj === null) {
        objs.trsobj = getJson('/VGV/track/trss.json');
    }
    acc = objs.trsobj[urlInfo.spe.split(".")[0]]
    if (acc === undefined) {
        var div = document.querySelector("#gcp")
        dic.innerHTML = 'Only coronavirus has transcriptional regulatory sequence analysis results'
        return
    }
    var height = 25; //画布的高度
    var rwidth = width / urlInfo.len();
    var svg = addMovableSvg("#trs",width,height);
    var line_right = []
    for (let trs of acc) {
        var ins = parseInt(trs.start)
        var ine = parseInt(trs.end)
        if (ins <= drawright + 1 && ine >= drawleft + 1) {
            var dstart = Math.max(vertex, vertex + (ins - drawleft - 1) * rwidth)
            var dwidth = Math.min((ine - Math.max(ins, drawleft + 1) + 1) * rwidth, 2 * width - dstart)
            if (dwidth < 3) {
                dwidth = 3
            }
            var g = svg.append("g")
            var rect = g.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", dwidth)
                .attr("height", 10)
                .attr("fill", "#EE4000")
            var text = g.append('text')
                .text('TRS-' + trs.type.toUpperCase())
                .attr('fill', '#EE4000')
                .attr('x', 0)
                .attr('y', 12) //注意text的（x,y）对应文字左下角
                .style('font-size', 15)
                .style('font-style', 'italic')
            var textwidth = text.node().getBBox().width
            g.select("text")
                .attr("dx", -textwidth - 2)
                .attr("dy", "0")
            var unset = true
            var i = 0
            if ((dstart - textwidth < 0) && (dstart + dwidth > 0)) {
                for (; i < line_right.length - 1; i++) {
                    if ((line_right[i] < dstart) && (line_right[i + 1] < 0)) {
                        g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                        text.attr("x", -dstart + 2)
                            .attr("dx", "0")
                            .attr("dy", 20)
                        line_right[i] = dstart + dwidth
                        line_right[i + 1] = 2 + textwidth
                        unset = false
                        break
                    }
                }
                if (unset) {
                    if ((line_right.length === 0)) {
                        line_right.push(dstart + dwidth)
                        svg.attr("height", height += 20)
                    } else if (line_right[i] > dstart) {
                        line_right.push(dstart + dwidth)
                        svg.attr("height", height += 20)
                        i++
                    } else {
                        line_right[i] = dstart + dwidth
                    }
                    line_right.push(2 + textwidth)
                    g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                    text.attr("x", -dstart + 2) //x设置为靠近视野左边界（注意x的值是text相对于g）
                        .attr("dx", "0")
                        .attr("dy", 20)
                    svg.attr("height", height += 20)
                }
            } else { //根据各行最右端确定放置于哪一行
                for (; i < line_right.length; i++) {
                    if (line_right[i] < dstart - textwidth - 4) {
                        g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                        line_right[i] = dstart + dwidth
                        unset = false
                        break
                    }
                }
                if (unset) {
                    line_right.push(dstart + dwidth)
                    g.attr("transform", "translate(" + dstart + "," + (20 * i + 10) + ")")
                    svg.attr("height", height += 20)
                }
            }
        }
    }
}

//拖动效果
function zooming({transform}) {
    if (((urlInfo.start - 1) * width / urlInfo.len() > transform.x) && ((speInfo.seq_len - urlInfo.end) * width / urlInfo.len() > -transform.x)) { //防止拖过头
        d3.selectAll("#trackpanel line,#trackpanel rect,.scasvg text,.movablesvg text,#trackpanel polyline,.movablesvg circle").attr("transform", transform)
        d3.select(".ovedivborder").style("left", ovedivborderleft - transform.x * urlInfo.len() / speInfo.seq_len + "px")
    }
}

//拖动后重新加载
function zoomed({transform}) {
    if (transform.x !== 0) { //防止由单击触发
        offset = Math.round(transform.x / width * urlInfo.len()) //偏移碱基数
        if (urlInfo.start - offset <= 0) { //左边拉到头
            urlInfo.end = 1 + urlInfo.len() - 1
            urlInfo.start = 1
            vertex = 0
        } else if (urlInfo.end - offset > speInfo.seq_len) { //右边拉到头
            urlInfo.start = speInfo.seq_len - urlInfo.len() + 1
            urlInfo.end = speInfo.seq_len
            vertex = 0
        } else {
            urlInfo.start -= offset
            urlInfo.end -= offset
            vertex = last_vertex + transform.x - offset * width / urlInfo.len() //可视范围内第一个碱基左上角坐标需要偏移小数部分
        }
        reset()
    }
}

function nullclick() { //避免频繁点击
    d3.select("#toleft").attr("onclick", null)
    setTimeout('d3.select("#toleft").attr("onclick","toleft()")', trandura)
    d3.select("#toright").attr("onclick", null)
    setTimeout('d3.select("#toright").attr("onclick","toright()")', trandura)
    d3.select("#zoomout").attr("onclick", null)
    setTimeout('d3.select("#zoomout").attr("onclick","zoomout()")', trandura)
    d3.select("#zoomin").attr("onclick", null)
    setTimeout('d3.select("#zoomin").attr("onclick","zoomin()")', trandura)
}

//向左按钮
function toleft() {
    nullclick()
    var len_tmp = urlInfo.len() //注意urlInfo.len()会变化
    var slidelen = width
    if (urlInfo.start - len_tmp <= 0) { //左边拉到头
        slidelen = width * (urlInfo.start - 1) / len_tmp
        urlInfo.end = 1 + len_tmp - 1
        urlInfo.start = 1
        vertex = 0
    } else {
        urlInfo.start -= len_tmp
        urlInfo.end -= len_tmp
        vertex = last_vertex
    }
    d3.selectAll("#sca .axis")
        .transition()
        .duration(trandura)
        .attr("transform", "translate(" + slidelen + ",30)") //坐标轴没有x属性，但有translate
    d3.selectAll("#trackpanel polyline")
        .transition()
        .duration(trandura)
        .attr("transform", "translate(" + slidelen + ",0)")
    d3.selectAll("#trackpanel rect,.movablesvg text,.movablesvg circle")
        .each(function (d) {
            var elemTran = d3.select(this)
                .transition()
                .duration(trandura)
                .attr("x", parseFloat(d3.select(this).attr("x")) + slidelen)
        })
    d3.select(".ovedivborder")
        .each(function (d) {
            d3.select(this)
                .transition()
                .duration(trandura)
                .style("left", parseFloat(d3.select(this).style("left")) - slidelen * urlInfo.len() / speInfo.seq_len + "px")
        })
    setTimeout(reset, trandura); //留出过渡时间
}

//向右按钮
function toright() {
    nullclick()
    var len_tmp = urlInfo.len()
    var slidelen = width
    if (urlInfo.end + len_tmp > speInfo.seq_len) { //右边拉到头
        slidelen = width * (speInfo.seq_len - urlInfo.end) / len_tmp
        urlInfo.start = speInfo.seq_len - len_tmp + 1
        urlInfo.end = speInfo.seq_len
        vertex = 0
    } else {
        urlInfo.start += len_tmp
        urlInfo.end += len_tmp
        vertex = last_vertex
    }
    d3.selectAll("#sca .axis")
        .transition()
        .duration(trandura)
        .attr("transform", "translate(" + (-slidelen) + ",30)") //坐标轴没有x属性，但有translate
    d3.selectAll("#trackpanel polyline")
        .transition()
        .duration(trandura)
        .attr("transform", "translate(" + (-slidelen) + ",0)")
    d3.selectAll("#trackpanel rect,.movablesvg text,.movablesvg circle")
        .each(function (d) {
            var elemTran = d3.select(this)
                .transition()
                .duration(trandura)
                .attr("x", parseFloat(d3.select(this).attr("x")) - slidelen)
        })
    d3.select(".ovedivborder")
        .each(function (d) {
            d3.select(this)
                .transition()
                .duration(trandura)
                .style("left", parseFloat(d3.select(this).style("left")) + slidelen * urlInfo.len() / speInfo.seq_len + "px")
        })
    setTimeout(reset, trandura);
}

function zoomin() {
    nullclick()
    //视野缩小为原来的1/3，最小视野范围设为25b
    var left = Math.round(urlInfo.end / 3 + urlInfo.start * 2 / 3)
    var right = Math.round(urlInfo.end * 2 / 3 + urlInfo.start / 3)
    var middle = Math.round((left + right) / 2)
    var len_tmp = urlInfo.len()
    if (right - left < 25) {
        urlInfo.start = middle - 12
        urlInfo.end = middle + 12
    } else {
        urlInfo.start = left
        urlInfo.end = right
    }
    vertex = 0
    d3.selectAll(".scasvg,.movablesvg")
        .transition()
        .duration(trandura)
        .attr("transform", "scale(" + len_tmp / urlInfo.len() + ", 1)")
    setTimeout(reset, trandura);
}

function zoomout() {
    nullclick()
    //视野放大为原来的3倍，最大视野范围设为总长度
    var left = Math.round(urlInfo.start * 2 - urlInfo.end)
    var right = Math.round(urlInfo.end * 2 - urlInfo.start)
    var rsl = right - left
    var len_tmp = urlInfo.len()
    if (rsl + 1 > speInfo.seq_len) {
        urlInfo.start = 1
        urlInfo.end = speInfo.seq_len
    } else if (left > 0 && right <= speInfo.seq_len) {
        urlInfo.start = left
        urlInfo.end = right
    } else if (left <= 0) {
        urlInfo.start = 1
        urlInfo.end = 1 + rsl
    } else {
        urlInfo.start = speInfo.seq_len - rsl
        urlInfo.end = speInfo.seq_len
    }
    vertex = 0
    d3.selectAll(".scasvg,.movablesvg")
        .transition()
        .duration(trandura)
        .attr("transform", "scale(" + len_tmp / urlInfo.len() + ", 1)")
    setTimeout(reset, trandura);
}

//后退
function gobackward() {
    nullclick()
    forstack.push(backstack.pop()); //第一次弹出来的是当前url
    urlInfo=backstack.pop();
    vertex = 0
    reset("stackSet");  //防止置空forstack
}

//前进
function goforward() {
    nullclick()
    urlInfo=forstack.pop();
    vertex = 0
    reset("stackSet");
}

function setIcon(id,ifGrey){
    if(ifGrey){
        $("#"+id).attr("class","tool-icon-grey")
                 .attr("onclick","null")
                 .attr("class","tool-icon-grey")
                 .attr("onclick","null");
    }else{
        $("#"+id).attr("class","tool-icon")
                 .attr("onclick",id+"()")
                 .attr("class","tool-icon")
                 .attr("onclick",id+"()");
    }
}

//设置工具栏输入组件
function setInputpos() {
    //document.getElementById("sechr").innerHTML = ""
    //var option = document.createElement("OPTION")
    //option.text = "-"
    //option.value = "1"
    //document.getElementById("sechr").options.add(option)
    $("#inpos1").val(urlInfo.start)
    $("#inpos2").val(urlInfo.end)
    let isBase = urlInfo.spe.indexOf("Protein") === -1;
    document.getElementById("lenp").innerHTML = '<p style="color:#2F4F4F;">' + urlInfo.len() + (isBase ? 'bp' : 'AAs') + '</p>'
    document.getElementById("inpos1").oninput = inputlen
    document.getElementById("inpos2").oninput = inputlen
}

//显示输入序列长度
function inputlen() {
    var in1 = parseInt($("#inpos1").val())
    var in2 = parseInt($("#inpos2").val())
    let isBase = urlInfo.spe.indexOf("Protein") === -1;
    if (in1 && in2 && in1 > 0 && in2 <= speInfo.seq_len && in1 < in2) {
        document.getElementById("lenp").innerHTML = '<p style="color:#2F4F4F;">' + (in2 - in1 + 1) + (isBase ? 'bp' : 'AAs') + '</p>'
    } else {
        document.getElementById("lenp").innerHTML = '<p style="color:#2F4F4F;">-</p>'
    }
}

//跳到指定位置
function jump() {
    var star = $("#inpos1").val()
    var en = $("#inpos2").val()
    if (star === '') {
        star = urlInfo.start
    }
    if (en === '') {
        en = urlInfo.end
    }
    //判断输入是否合法，一定注意parseInt要放在前面，否则其他条件不满足
    if ((star = parseInt(star)) && (en = parseInt(en)) && star > 0 && en <= speInfo.seq_len && star < en) {
        if (en < star + 24) {
            alert("The range is too short. Please input or select a longer range.")
        } else {
            urlInfo.start = star
            urlInfo.end = en
            vertex = 0
            $("#inpos1").val('')
            $("#inpos2").val('')
            reset()
        }
    } else {
        alert("Invalid input. Please check your input.")
    }
}

//Set Track按钮
function setrkbt() {
    var trklist = $('#setrk').val()
    if (trklist.length === 0) {
        alert("Please choose at least one track.")
    } else {
        var newtrk = ''
        trklist.forEach(function (e) {
            newtrk = newtrk + '+' + e
        })
        urlInfo.trk = newtrk.slice(1)
        vertex = 0
        reset()
    }
}

//点击基因出现基因/蛋白质信息弹窗
function divEmerge(record, type) {
    var e = event || window.event
    var intbody = ''
    var divid = ''
    //使用js原生dom操作，监听更方便
    if (type === 'gene') {
        divid = type + record.gene_num
    } else if (type === 'pro') {
        divid = type + record.entry
    } else if (type === 'prod') {
        divid = type + record.pro_num
    }
    if (document.getElementById(divid) !== null) { //防止同一条记录出现多个弹窗
        return
    }
    var div = document.createElement("div");
    document.body.appendChild(div);
    div.className = "recorddiv"
    div.style.top = e.pageY + "px"
    div.style.left = e.pageX + "px"
    if (type === 'gene') {
        for (let att in record.attributes) {
            intbody = intbody + '<tr><td>' + att.replace("_", " ") + '</td><td>' + record.attributes[att] + '</td></tr>'
        }
        div.id = divid
        div.style.border = '3px solid purple'
        div.innerHTML = '<div style="display: inline-block;"><h4 style="color:#551A8B;font-style: italic;">' + record.attributes.Name + '</h4></div>\
            <div style="display: inline-block;float: right;cursor:pointer;" onclick="d3.selectAll(\'#' + div.id + '\').remove()"><h4 style="color:#888;">✖</h4></div>\
            <p style="font-size: 10px;font-style: italic;">' + record.start + '-' + record.end + ' ' + record.strand + '</p>\
                <table class="table table-striped s1">\
                    <thead>\
                        <tr>\
                          <th>Attributes</th>\
                          <th>Value</th>\
                        </tr>\
                    </thead>\
                    <tbody>' + intbody +
            '<tr>\
                          <td></td>\
                          <td><a href="https://www.ncbi.nlm.nih.gov/gene/' + record.attributes.Dbxref.slice(7) + '" style="color:#551A8B;font-weight: bold;float:right;" target="_blank">NCBI Gene↗</a></td>\
                        </tr>\
                    </tbody>\
                </table>'
    } else if (type === 'pro') {
        unshow = ['seq', 'start', 'end', 'name']
        for (let att in record) {
            if (!unshow.includes(att)) {
                intbody = intbody + '<tr><td>' + att.replace("_", " ") + '</td><td>' + record[att].replace(/\(/g, '<br>(') + '</td></tr>'
            }
        }
        div.id = divid
        div.style.border = '3px solid #8B6914'
        div.innerHTML = '<div style="display: inline-block;"><h4 style="color:#8B6914;font-style: italic;">' + record.name + '</h4></div>\
            <div style="display: inline-block;float: right;cursor:pointer;" onclick="d3.selectAll(\'#' + div.id + '\').remove()"><h4 style="color:#888;">✖</h4></div>\
            <p style="font-size: 10px;font-style: italic;">' + record.start + '-' + record.end + ' </p>\
                <table class="table table-striped s2">\
                    <thead>\
                        <tr>\
                          <th>Attributes</th>\
                          <th>Value</th>\
                        </tr>\
                    </thead>\
                    <tbody>' + intbody +
            '<tr>\
                          <td></td>\
                          <td><a href="https://www.uniprot.org/uniprot/' + record.entry + '" style="color:#8B6914;font-weight: bold;float:right;" target="_blank">UniProtKB↗</a></td>\
                        </tr>\
                    </tbody>\
                </table>'
    } else if (type === 'prod') {
        intbody = intbody + '<tr><td>Entry</td><td>' + record.seqname + '</td></tr>'
        for (let att in record.attributes) {
            intbody = intbody + '<tr><td>' + att.replace("_", " ") + '</td><td>' + record.attributes[att] + '</td></tr>'
        }
        div.id = divid
        div.style.border = '3px solid #363636'
        div.innerHTML = '<div style="display: inline-block;"><h4 style="color:#363636;font-style: italic;">' + record.feature + '</h4></div>\
            <div style="display: inline-block;float: right;cursor:pointer;" onclick="d3.selectAll(\'#' + div.id + '\').remove()"><h4 style="color:#888;">✖</h4></div>\
            <p style="font-size: 10px;font-style: italic;">' + record.start + '-' + record.end + '</p>\
                <table class="table table-striped s3">\
                    <thead>\
                        <tr>\
                          <th>Attributes</th>\
                          <th>Value</th>\
                        </tr>\
                    </thead>\
                    <tbody>' + intbody +
            '<tr>\
                          <td></td>\
                          <td><a href="https://www.uniprot.org/uniprot/' + record.seqname + '" style="color:#363636;font-weight: bold;float:right;" target="_blank">UniProtKB↗</a></td>\
                        </tr>\
                    </tbody>\
                </table>'
    }

    div.style.cursor = "move"
    div.onmousedown = function (ev) { //可以随意拖动
        var oevent = ev || event;
        var distanceX = oevent.clientX - div.offsetLeft;
        var distanceY = oevent.clientY - div.offsetTop;
        document.onmousemove = function (ev) {
            var oevent = ev || event;
            div.style.left = oevent.clientX - distanceX + 'px';
            div.style.top = oevent.clientY - distanceY + 'px';
        };
        document.onmouseup = function () {
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }
}

function help(lable){
    window.open('/VGV/documentation#'+lable);
}

function getJson(jsonURL) {
    var obj = null;
    $.ajax({
        url: jsonURL,
        async: false, //关掉异步
        dataType: 'json',
        success: function (result) {
            obj = result;
        }
    });
    return obj;
}

function addMovableSvg(sel,width,height){
    return d3.select(sel)
        .append("svg")
        .classed("movablesvg", true)
        .attr("width", width)
        .attr("height", height)
        .style("transition", "left 2s")
        .style("position", "relative")
        .style("left", "0px")
        .attr("cursor", "grab")
        .on("mousemove", function () {
            d3.select(this).call(d3.zoom()
                .extent([
                    [0, 0],
                    [width, height]
                ])
                .translateExtent([
                    [-Number.MAX_VALUE, 0],
                    [Number.MAX_VALUE, height]
                ])
                .scaleExtent([1, 1])
                .on("zoom", zooming)
                .on("end", zoomed));
        });
}

function setTrack() {
    $("#trackpanel").append('<div class="loader"></div>')
    if (url.indexOf("/gb/") !== -1) { //单序列可视化
        var selist = []
        setInputpos()
        redraw()
        oveTrack()
        var trks = urlInfo.trk.split('+')
        $("#tratab tr").each(function (i) { //选中行标记对号并显示,一定放前面，不然display影响getBBox等函数
            $(this).children('td').each(function (j) {
                if (typeof ($(this).attr('id')) !== "undefined") {
                    if (trks.indexOf($(this).attr('id')) > -1) {
                        selist.push($(this).attr('id'))
                        $(this).parent().css('display', 'table-row')
                    } else {
                        $(this).parent().css('display', 'none')
                    }
                }
            })
        })
        if (trks.includes("seq")) {
            seqTrack()
        }
        if (trks.includes("ref")) {
            refTrack()
        }
        if (trks.includes("pro")) {
            proTrack()
        }
        for (var i = 0; i < trks.length; i++) {
            if ((trks[i].includes("pro")) && (trks[i].length === 6)) {
                promulTrack()
                break
            }
        }
        if (trks.includes("gcp")) {
            gcpTrack()
        }
        if (trks.includes("trs")) {
            trsTrack()
        }
        $("#setrk").selectpicker('val', selist)
        scaleTrack() //放最后以调整高度
    } else {
        if (url.indexOf("/mul/") !== -1) {
            alnTrack()
        } else if (url.indexOf("/ncov") !== -1) {
            if(packconfig[0]===0) {
                covPackTrack(packconfig[1])
            }else{
                covTrack()
            }
        }
        setInputpos()
        oveTrack()
        scaleTrack()
    }
    $(".loader").remove();
}


//重新绘制,非特殊情况下前面要设置vertex = 0
function reset() {
    var scrollPos; //防止滚动条回滚
    if (typeof window.pageYOffset !== 'undefined') {
        scrollPos = window.pageYOffset;
    } else if (typeof document.compatMode !== 'undefined' && document.compatMode !== 'BackCompat') {
        scrollPos = document.documentElement.scrollTop;
    } else if (typeof document.body !== 'undefined') {
        scrollPos = document.body.scrollTop;
    }
    if (url.indexOf("/gb/") !== -1) {
        window.history.pushState({}, 0, "spe=" + urlInfo.spe + "&loc=" + urlInfo.chr + ":" + urlInfo.start + ".." + urlInfo.end + "&track=" + urlInfo.trk); //更改url
    }else if(url.indexOf("/ncov?") !== -1&&arguments[0]!=="changeTime"){
        window.history.pushState({}, 0, "ncov?"+url.split("/ncov?")[1].split("&track=")[0] + "&track=" + urlInfo.trk); //更改url
    }
    if(arguments[0]!=="changeTime")backstack.push($.extend(true,{},urlInfo));
    if(arguments[0]!=="stackSet") forstack=[];

    setIcon("gobackward",backstack.length<=1);
    setIcon("goforward",forstack.length===0);
    setIcon("toleft",urlInfo.start<=1);
    setIcon("toright",urlInfo.end>=speInfo.seq_len);
    setIcon("zoomin",urlInfo.len()<=25);
    setIcon("zoomout",urlInfo.len()>=speInfo.seq_len);

    d3.selectAll("#trackpanel svg,.ovedivborder").remove()
    setTrack()
    document.documentElement.scrollTop = scrollPos
    document.body.scrollTop = scrollPos
}