/**
 * Module Dependencies
 */
const errors = require('restify-errors')
/**
 * Model Schema
 */
const Todo = require('../models/todo')

module.exports = function(server, apiUrl) {
	const requestUrl = `${apiUrl}/todos`

	/**
	 * POST
	 */
	server.post(requestUrl, (req, res, next) => {
		if (!req.is('application/json')) {
			return next(new errors.InvalidContentError("Expects 'application/json'"))
		}
		let data = req.body || {}
		let todo = new Todo(data)
		todo.save(function(err) {
			if (err) {
				console.error(err)
				return next(new errors.InternalError(err.message))
				next()
			}
			res.send(201)
			next()
		})
	})
	/**
	 * LIST
	 */
	server.get(requestUrl, (req, res, next) => {
		Todo.apiQuery(req.params, function(err, docs) {
			if (err) {
				console.error(err)
				return next(new errors.InvalidContentError(err.errors.name.message))
			}
			res.send(docs)
			next()
		})
	})
	/**
	 * GET
	 */
	server.get(`${requestUrl}:todo_id`, (req, res, next) => {
		Todo.findOne({ _id: req.params.todo_id }, function(err, doc) {
			if (err) {
				console.error(err)
				return next(new errors.InvalidContentError(err.errors.name.message))
			}
			res.send(doc)
			next()
		})
	})
	/**
	 * UPDATE
	 */
	server.put(`${requestUrl}:todo_id`, (req, res, next) => {
		if (!req.is('application/json')) {
			return next(new errors.InvalidContentError("Expects 'application/json'"))
		}
		let data = req.body || {}
		if (!data._id) {
			data = Object.assign({}, data, { _id: req.params.todo_id })
		}
		Todo.findOne({ _id: req.params.todo_id }, function(err, doc) {
			if (err) {
				console.error(err)
				return next(new errors.InvalidContentError(err.errors.name.message))
			} else if (!doc) {
				return next(new errors.ResourceNotFoundError('The resource you requested could not be found.'))
			}
			Todo.update({ _id: data._id }, data, function(err) {
				if (err) {
					console.error(err)
					return next(new errors.InvalidContentError(err.errors.name.message))
				}
				res.send(200, data)
				next()
			})
		})
	})
	/**
	 * DELETE
	 */
	server.del(`${requestUrl}:todo_id`, (req, res, next) => {
		Todo.remove({ _id: req.params.todo_id }, function(err) {
			if (err) {
				console.error(err)
				return next(new errors.InvalidContentError(err.errors.name.message))
			}
			res.send(204)
			next()
		})
	})
}
