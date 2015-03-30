L.Control.LayerPlayer = L.Control.extend({
  options: {
    position: 'bottom',
    slides: {},
    tile: '',
    tms: false,
    maxZoom: 13,
    attribution: '',
    delay: 3500
  },
  
  initialize: function(options) {
    L.Util.setOptions(this, options);
    this._idx = 0;
    this._rid = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);;
    this.$overlay = jQuery();
  },
  onAdd: function(map) {
    this.options.map = map;
    this.$map = $(map._container);
    this.addOverlay();
    this.addLayers();

    var div = L.DomUtil.create('div', 'controlbar', this._container);
    var $control = this.addControlBar(div);
    this.changeLayer(0);
    return $control[0];
  },

  addOverlay: function() {
    var opt = this.options;
    var obj = this;
    this.$overlay.remove();
    this.$overlay = $('<div class="overlay" id="overlay-'+this._rid+'"><i class="fa fa-spinner fa-spin"></i></div>');
    var $play = $('<i class="fa fa-play-circle-o slide-play" id="play-'+this._rid+'"></i>');
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
    }, this.options.delay);
  },

  addControlBar: function(div) {
    var $overlay = this.$overlay;
    var $control = $(div);
    var opt = this.options;
    var slides = opt.slides;
    var obj = this;

    // control panel
    var $play = $('<i class="fa fa-play slide-icon slide-play" id="splay-'+this._rid+'"></i>');
    var $pause = $('<i class="fa fa-pause slide-icon slide-pause" id="spause-'+this._rid+'"></i>');
    var $prev = $('<i class="fa fa-backward slide-icon slide-prev" id="sprev-'+this._rid+'"></i>');
    var $next = $('<i class="fa fa-forward slide-icon slide-next" id="snext-'+this._rid+'"></i>');
    $control.append($play);
    $control.append($pause);
    $control.append($prev);
    $control.append($next);
    
    // jquery ui slider
    var $slider = $('<div id="slider-'+this._rid+'" class="slider"></div>');
    var labels = [];
    for(var i = 0; i < this.options.slides.rows.length; i++){
      labels.push(this.options.slides.rows[i].date);
    }
    this.$slider = $slider.slider({
      value: 0,
      min: 0,
      max: obj.options.slides.rows.length - 1,
      step: 1
    })
    .slider("pips", {
      rest: "label",
      labels: labels
    })
    .on("slidechange", function(e, ui) {
      obj._changeLayer(ui.value);
    });
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
    return $control;
  },

  addLayers: function(i) {
    var slide, server, rgbview;
    var attribution = this.options.attribution;
    for(var i = 0; i < this.options.slides.rows.length; i++){
      slide = this.options.slides.rows[i];

      // random server
      server = this.options.tile.replace('{slide.title}', slide.title);
      rgbview = L.tileLayer(server, {
        tms: this.options.tms,
        attribution: attribution,
        maxZoom: this.options.maxZoom
      });
      rgbview.addTo(this.options.map);
    }
  },
  
  changeLayer: function(i) {
    this.$slider.slider("value", i);
  },
  _changeLayer: function(i) {
    this._idx = i;
    var slide = this.options.slides.rows[i];
    var idx = i+1;
    this.$map.find('.current').fadeOut(600);
    this.$map.find('.current').removeClass('current');

    var current = this.$map.find('.leaflet-tile-pane .leaflet-layer:eq('+idx+')');
    current.addClass('current');
    current.hide();
    current.css('z-index', 999);
    current.fadeIn(300);
    this.$map.find('.slide-legend h3').html(slide.date);
    this.$map.find('.leaflet-tile-pane .leaflet-layer').not('.current').css('z-index', 0);
  },
  next: function() {
    if(this._idx + 1 < this.options.slides.rows.length){
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
    this.$overlay.fadeOut();
    this.$map.find('.leaflet-tile-pane .leaflet-layer:not(:eq(1))').hide();
    this.$map.find('.leaflet-tile-pane .leaflet-layer:eq(0)').show();
    this.options.interval = setInterval(function() {
      if(i >= obj.options.slides.rows.length ){
        i = 0;
        clearInterval(obj.options.interval);
        return;
      }
      else{
        obj.changeLayer(i);
        i++;
      }
    }, 2000);
  },
  pause: function() {
  
  }
});

L.control.layerPlayer = function (options) {
  return new L.Control.LayerPlayer(options);
};
