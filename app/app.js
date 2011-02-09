(function($) {
	
	$(document).ready( function() {
		/*
			a result model
		*/
		var Result = Backbone.Model.extend({
			title:null,
			id:null
		});



		/*
			a results collection - a collection of reslt models
			much of this is based on https://gist.github.com/705733
		*/
		var Results = Backbone.Collection.extend({
			initialize: function(models, options) {
				_.bindAll(this, 'parse', 'url', 'pageInfo', 'nextPage', 'previousPage');
				// when the collection contents have changed, trigger the view's addResult method
				this.bind("refresh", options.view.render);
				this.initSettings();
			},
			
			model:Result,
			page:1,
			
			url:function() {
				return 'http://www.urbandictionary.com/iphone/search/define?term='+
							encodeURIComponent(this.searchterm)+
							'&page='+encodeURIComponent(this.page);
			},
			
			initSettings:function() {
				this.searchterm = null;
				this.selected = null;
				this.page = 1;
				this.total = 0;
				this.total_pages = 0;
				this.result_type = null;
				this.has_related_words = null;
			},
			
			fetch:function(opts) {
				opts = opts || {};
				
				var that = this;
				var success = opts.success;

				this.trigger('fetching');
				
				opts.success = function(resp) {
					if (success) {
						success(that, resp);
					}
				};
				
				// call the original fetch
				Backbone.Collection.prototype.fetch.call(this, opts);
			},
			
			parse:function(response) {
				this.total = response.total;
				this.total_pages = response.pages;
				this.result_type = response.result_type;
				this.has_related_words = response.has_related_words;
				return response.list;
			},
			
			setSelected: function(cid) {
				var obj = this.getByCid(cid);
				this.selected = obj;
			},
			
			selected:null,
			searchterm:null
		});


		// we use doT.js templates
		Templates = {
			'results':[
				// '{{ console.dir(arguments); }}',
				'<ul data-role="listview" data-inset="true" id="results-list">',
					'{{ _.each(it, function(res) { }}',
						'<li data-id="{{=res.cid}}">',
							'<a href="#page-detail" data-cid={{=res.cid}}>{{=res.attributes.word}}</a>',
							'<span class="ui-li-count"><span class="thumbs_up">{{=res.attributes.thumbs_up}}</span> / <span class="thumbs_down">{{=res.attributes.thumbs_down}}</span></span>',
							'</li>',
					'{{ }); }}',
				'</ul>'
			].join('')
		};
		
		/*
			compile all templates
		*/
		for (var tplkey in Templates) {
			Templates[tplkey] = doT.template(Templates[tplkey]);
		}


		AppView = Backbone.View.extend({
			el:$('body'),
			initialize: function () {
				this.results = new Results( null, { view: this });
			},
			
			events: {
				'click #search-button':'search',
				'click #loadmore':'loadMore',
				'click #results-list>li':'setSelected'
			},
			
			search: function() {
				this.results.searchterm = $('#search').val();
				if (!this.results.searchterm) { // skip out if it is empty
					return;
				}
				this.results.fetch();
			},
			
			loadMore: function() {
				if (this.results.page < this.results.total_pages) {
					this.results.page++;
					this.results.fetch();
				}
			},
			
			render: function(collection) {
				$("#results").html( Templates.results(this.models) );
				
				if (collection.total_pages > collection.page) {
					$('#loadmore').show();
				} else {
					$('#loadmore').hide();
				}
				
				appview.reapplyStyles();
				return this;
			},
			
			reapplyStyles: function(el) {
				el = el || this.el;
				el.find('ul[data-role]').listview();
				el.find('div[data-role="fieldcontain"]').fieldcontain();
				el.find('button[data-role="button"]').button();
				el.find('input,textarea').textinput();
				return el.page();
			},
			
			setSelected: function(e) {
				var cid = $(e.target).attr('data-cid');
				this.results.setSelected(cid);
				this.renderSelected();				
			},
			
			/**
			 * doing this here just seems easier 
			 */
			renderSelected: function() {
				$('#header-detail>h1').text(this.results.selected.attributes.word);
				$('#definitions').html(this.nl2br(this.results.selected.attributes.definition));
				$('#examples').html(this.nl2br(this.results.selected.attributes.example));
			},
			
			nl2br:function(str, breaktag) {

				breaktag = breaktag || '<p></p>';

				str = str.replace(/(\r\n|\n\r|\r|\n)/g, breaktag+'$1');
				return str;
			}
		});

		var appview = new AppView();
	});
	

})(jQuery);