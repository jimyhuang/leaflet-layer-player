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
    setTimeout(function() {
      $o.html('');
      $o.append($play);
    }, this.options.loadingDelay);
  },

  addTitle: function() {
    var $title = $('<div class="slide-title"></div>');
    $title.html(this.options.slides.subject);
    $title.prependTo(this.$map);
  },

  addControlBar: function(div) {
    var $overlay = this.$overlay;
    var $control = $(div);
    var opt = this.options;
    var slides = opt.slides;
    var obj = this;

    // control panel
    var $play = $('<i class="fa fa-play slide-icon slide-play" id="splay-' + this._rid + '"></i>');
    var $pause = $('<i class="fa fa-pause slide-icon slide-pause" id="spause-' + this._rid + '"></i>');
    var $prev = $('<i class="fa fa-backward slide-icon slide-prev" id="sprev-' + this._rid + '"></i>');
    var $next = $('<i class="fa fa-forward slide-icon slide-next" id="snext-' + this._rid + '"></i>');
    $control.append($play);
    $control.append($pause);
    $control.append($prev);
    $control.append($next);
    
    // jquery ui slider
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
    $slider.width(this.$map.width() - 280);
    $control.append($slider);

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
    this.$map.find('.current').fadeOut(600);
    this.$map.find('.current').removeClass('current');

    var current = this.$map.find('.leaflet-tile-pane .leaflet-layer:eq(' + idx + ')');
    current.addClass('current');
    current.hide();
    current.css('z-index', 999);
    current.fadeIn(300);
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
