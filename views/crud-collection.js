var app = require('ridge');

module.exports = require('ridge/view').extend({
	events: {
		'click :has(.controls):not(.editing)': function(e) {
			var view = _.findWhere(this.modelViews, { el: e.currentTarget });
			if (view && view.controls) {
				view.controls.edit(e);
				view.$el.addClass('editing');
			}
		}
	},

	initialize: function(options) {
		var _view = this;

		_.extend(this, _.pick(options, 'modelTemplate'));

		if(_.isString(options.collection))
			this.collection = new app.collections[options.collection]();

		_view.listenTo(_view.collection, 'add', _view.add);
		//_view.listenTo(_view.collection, 'remove', _view.remove);
		_view.listenTo(_view.collection, 'reset', _view.reset);
	},

	attach: function() {
		this.collection.fetch({ reset: true });
	},

	reset: function (models, options) {
		models.each(this.renderModel, this);
	},

	renderModel: function(model) {
		new app.views.CrudModel({
			model: model,
			template: this.modelTemplate

		}).enter(this.el);
	},
});
