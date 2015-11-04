var set = Backbone.Model.prototype.set;

module.exports = Backbone.Model.extend({
	constructor: function(attrs, opts) {
		Backbone.Model.apply(this, arguments);

		var _model = this;

		_model.originalAttributes = _.clone(_model.attributes);

		_model.on('sync', function() {
			_model.originalAttributes = _.clone(_model.attributes);
		});

		_.extend(this, _.pick(opts, 'validation'));
	},

	get: function(attr) {
		var path = attr.split('.'),
			val = this.attributes[path.shift()];

		while ((attr = path.shift()) != null) {
			if (!_.has(val, attr)) return;

			val = val[attr];
		}

		return val;
	},

	idAttribute: '_id',

	isDirty: function() {
		return !_.isEqual(this.attributes, this.originalAttributes);
	},

	save: function(attrs, options) {
		options = _.extend({ validateAll: true }, options);

		return Backbone.Model.prototype.save.call(this, attrs, options);
	},

	set: function(key, val, options) {
		if (key == null) return this;

		if (typeof key == 'object') {
			attrs = key;
			options = val;
		} else {
			(attrs = {})[key] = val;
		}

		return set.call(this, this.unflatten(attrs), options);
	},

	_validate: function(attrs, options) {
		if (!options.validate || !this.validate) return true;

		if (options.validateAll)
			attrs = _.extend({}, this.attributes, attrs);

		var error = this.validationError = this.validate(attrs, options) || null;
		if (!error) return true;
		this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
		return false;
	},

	// pick nested attributes
	flatten: function(attrs, keys) {
		attrs = this.unflatten(attrs);

		var result = {};

		_.each(keys, function(key) {
			var path = key.split('.'),
				val = attrs;

			while (path.length) {
				var attr = path.shift();

				if (!_.has(val, attr)) return;

				val = val[attr];
			}

			result[key] = val;
		});

		return result;
	},

	// return an unflattened copy of attrs
	// merging dot-delimited attributes with nested attributes in this.attributes
	unflatten: function(attrs) {
		var result = {},
			attributes = this.attributes;

		for (var attr in attrs) {
			var val = attrs[attr],
				path = attr.split('.');

			if (path.length > 1) {
				attr = path.pop();

				var obj = _.reduce(path, makeNested, result);

				if (obj[attr] !== val)
					obj[attr] = val;
			} else {
				result[attr] = val;
			}
		}

		function makeNested(obj, key, level) {
			var attrs = level || _.has(obj, key) ? obj : attributes;

			obj = obj[key] = {};

			// copy nested attributes
			_.some(attrs[key], function(val, key) {
				// check that we are not iterating an array-like object
				if (typeof key == 'number') return true;
				obj[key] = val;
			});

			return obj;
		}

		return result;
	},

	reset: function(options) {
		var attrs = {};
		for (var key in this.attributes) attrs[key] = void 0;

		this.originalAttributes = _.extend(attrs, this.originalAttributes);

		return this.set(attrs, options);
	},
});
