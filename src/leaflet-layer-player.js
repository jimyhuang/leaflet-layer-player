L.Control.LayerPlayer = L.Control.extend({
  options: {
    position: 'bottom',
    slides: {},
    tile: '',
    tms: false,
    maxZoom: 13,
    attribution: '',
    playInterval: 2000,
    overlay: true,
    loadingDelay: 3500,
    chart: false
  },
  
  initialize: function(options) {
    L.Util.setOptions(this, options);
    this._idx = 0;
    this._length = this.options.slides.rows.length;
    this._rid = Math.random().toString(36).replace(/[^a-z] + ./g, '').substr(-5);;
    this._layers = [];
    this.$overlay = jQuery();
  },

  onAdd: function(map) {
    this.options.map = map;
    
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();

    this.$map = $(map._container);
    this.addTitle();
    if (this.options.overlay) {
      this.addOverlay();
    }
    this.addLayers();

    var div = L.DomUtil.create('div', 'controlbar', this._container);
    var $control = this.addControlBar(div);
    this.changeLayer(0);

    if (this.options.chart) {
      this.addChart();
    }
    return $control[0];
  },

  onRemove: function (map) {
    for (var i = 0; i < this._length; i++) {
      map.removeLayer(this.layers[i]);
    }
  },

  addOverlay: function() {
    var opt = this.options;
    var obj = this;
    this.$overlay.remove();
    this.$overlay = $('<div class="overlay" id="overlay-' + this._rid + '"><i class="fa fa-spinner fa-spin"></i></div>');
    var $play = $('<i class="fa fa-play-circle-o slide-play" id="play-' + this._rid + '"></i>');
    $play.click(function() {
      obj.play();
    });
    
    this.$overlay.height(this.$map.height());
    this.$overlay.width(this.$map.width());
    this.$map.prepend(this.$overlay);
    var $o = this.$overlay;
    $(window).load(function() {
      $o.html('');
      $o.append($play);
    });
  },

  addTitle: function() {
    var $title = $('<div class="slide-title"></div>');
    $title.html(this.options.slides.subject);
    $title.prependTo(this.$map);
  },

  addControlBar: function(div) {
    var $overlay = this.$overlay;
    var $map = this.$map;
    var opt = this.options;
    var slides = opt.slides;
    var obj = this;

    // control button
    var $play = $('<i class="fa fa-play slide-icon slide-play" id="splay-' + this._rid + '"></i>');
    var $pause = $('<i class="fa fa-pause slide-icon slide-pause" id="spause-' + this._rid + '"></i>');
    var $prev = $('<i class="fa fa-backward slide-icon slide-prev" id="sprev-' + this._rid + '"></i>');
    var $next = $('<i class="fa fa-forward slide-icon slide-next" id="snext-' + this._rid + '"></i>');
    var $controlbutton = $('<div class="controlbutton"></div>');
    $controlbutton.append($play);
    $controlbutton.append($pause);
    $controlbutton.append($prev);
    $controlbutton.append($next);

    $next.click(function(e) {
      obj.next();
    });
    $prev.click(function(e) {
      obj.prev();
    });
    $play.click(function(e) {
      obj.play();
    });
    $pause.click(function(e) {
      obj.pause();
    });
    $(document).keydown(function(e){
      if ((e.keyCode || e.which) == 37){ //left
        obj.prev();
      }
      if ((e.keyCode || e.which) == 39){ //right
        obj.next();
      }
      if ((e.keyCode || e.which) == 32){ //space 
        obj.pause();
      }
      if ((e.keyCode || e.which) == 13){ //enter
        obj.play();
      }
    });

    var wheeling = 0;
    $map.mouseover(function(){
      $map.bind('mousewheel', function(e){
        e.preventDefault();
        if(!wheeling){
          wheeling++;
          if(e.originalEvent.wheelDelta /120 > 0) {
            setTimeout(function(){
              obj.prev();
              wheeling = 0;
            }, 100);
          }
          else{
            setTimeout(function(){
              obj.next();
              wheeling = 0;
            }, 100);
          }
        }
      });
    });
    
    $controlbutton.appendTo(this.$map);
    
    // jquery ui slider
    var $control = $(div);
    var $slider = $('<div id="slider-' + this._rid + '" class="slider"></div>');
    var labels = [];
    for (var i = 0; i < this._length; i++){
      labels.push(this.options.slides.rows[i].date);
    }
    this.$slider = $slider.slider({
      value: 0,
      min: 0,
      max: obj._length - 1,
      step: 1
    })
    .slider("pips", {
      rest: "label",
      labels: labels
    })
    .on("slidechange", function(e, ui) {
      obj._changeLayer(ui.value);
    });
    $slider.width(this.$map.width() - 200);
    $control.append($slider);
    return $control;
  },

  addChart: function() {
    this.$chart = $('<svg class="chart" id="chart-' + this._rid + '"></svg>');
    this.$chart.appendTo(this.$map);
    var length = this._length;
    if (typeof d3 !== 'undefined') {
      var height = this.$map.height() * 0.3;
      var bwidth = (this.$slider.width()/(length - 1));
      var width = bwidth * length;
      var left = parseInt(this.$chart.css('left')) - bwidth/2;
      this.$chart.css('left', left);

      var x = d3.scale.ordinal()
        .domain(d3.range(this._length))
        .rangeBands([0, width]);
      var y = d3.scale.linear()
        .range([height, 0]);
      var rows = this.options.slides.rows;

      for (var i = 0; i < this._length; i++) {
        rows[i].i = i;
      }
      d3.select('#chart-' + this._rid)
        .attr('width', width)
        .attr('height', height);
      d3.select('#chart-' + this._rid).selectAll(".bar")
        .data(this.options.slides.rows)
        .enter()
        .append('rect')
        .attr("class", "bar")
        .attr('x', function(d) { return x(d.i); })
        .attr("width", bwidth)
        .attr("y", function(d) { return y(d.data/100); })
        .attr("height", function(d) { return height - y(d.data/100); })
      d3.select('#chart-' + this._rid).selectAll(".text")
        .data(this.options.slides.rows)
        .enter()
        .append('text')
        .text(function(d) { return d.data + '%'; })
        .attr("class", "text")
        .attr('x', function(d) { return x(d.i) + bwidth/2 - 22; })
        .attr("width", bwidth)
        .attr("y", function(d) { return height - 30; })
        .attr("height", 15)
    }
  },

  addLayers: function(i) {
    var slide, server, rgbview;
    var attribution = this.options.attribution;
    for (var i = 0; i < this._length; i++){
      slide = this.options.slides.rows[i];

      // random server
      server = this.options.tile.replace('{slide.title}', slide.title);
      rgbview = L.tileLayer(server, {
        tms: this.options.tms,
        attribution: attribution,
        maxZoom: this.options.maxZoom
      });
      rgbview.addTo(this.options.map);
      this._layers.push(rgbview);
    }
  },
  
  changeLayer: function(i) {
    this.$slider.slider("value", i);
  },

  _changeLayer: function(i) {
    this._idx = i;
    var slide = this.options.slides.rows[i];
    var idx = i + 1;
    var $c = this.$map.find('.current:eq(0)');
    $c.removeClass('current');
    $c.hide();

    var current = this.$map.find('.leaflet-tile-pane .leaflet-layer:eq(' + idx + ')');
    current.addClass('current');
    current.css('z-index', 999);
    current.show();
    this.$map.find('.leaflet-tile-pane .leaflet-layer').not('.current').css('z-index', 0);
  },

  next: function() {
    if(this._idx + 1 < this._length){
      this.$slider.slider("value", this._idx + 1);
    }
  },

  prev: function() {
    if(this._idx > 0){
      this.$slider.slider("value", this._idx - 1);
    }
  },

  play: function() {
    var obj = this;
    if(this._idx == obj._length){
      this._idx = 0;
    }
    var i = this._idx;
    var layeridx = i++;
    this.$overlay.fadeOut();
    this.options.interval = setInterval(function() {
      if(i >= obj._length ){
        i = 0;
        clearInterval(obj.options.interval);
        return;
      }
      else{
        obj.changeLayer(i);
        i++;
      }
    }, this.options.playInterval);
  },

  pause: function() {
    clearInterval(this.options.interval);
  }
});

L.control.layerPlayer = function (options) {
  return new L.Control.LayerPlayer(options);
};
