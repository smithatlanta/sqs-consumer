var EventEmitter = require('events').EventEmitter;
var util = require('util');
var AWS = require('aws-sdk');
var nconf = require('nconf');

function Consumer(options) {
	nconf
		.argv()
		.env()
		.file({ file: 'config.json' });

	if(nconf.get('AWS_ACCESS_KEY_ID') === undefined || nconf.get('AWS_ACCESS_KEY_ID') === "")
	{
		throw("AWS_ACCESS_KEY_ID is required. You can either add it to the config.json, set an environment var or pass via --");
	}

	if(nconf.get('AWS_SECRET_ACCESS_KEY') === undefined || nconf.get('AWS_SECRET_ACCESS_KEY') === "")
	{
		throw("AWS_SECRET_ACCESS_KEY is required. You can either add it to the config.json, set an environment var or pass via --");
	}

	if(nconf.get('AWS_REGION') === undefined || nconf.get('AWS_REGION') === "")
	{
		throw("AWS_REGION is required. You can either add it to the config.json, set an environment var or pass via --");
	}

	if(nconf.get('QUEUE_PREFIX') === undefined || nconf.get('QUEUE_PREFIX') === "")
	{
		throw("QUEUE_PREFIX is required. You can either add it to the config.json, set an environment variable or pass via --");
	}

	if(nconf.get('ACCOUNT') === undefined || nconf.get('ACCOUNT') === "")
	{
		throw("ACCOUNT is required. You can either add it to the config.json, set an environment variable or pass via --");
	}

	if(nconf.get('MAXNUMBEROFMESSAGES') === undefined || nconf.get('MAXNUMBEROFMESSAGES') === "")
	{
		console.log("MAXNUMBEROFMESSAGES is missing. Set to default of 1.");
		this.MAXNUMBEROFMESSAGES = 1;
	}

	if(nconf.get('WAITTIMESECONDS') === undefined || nconf.get('WAITTIMESECONDS') === "")
	{
		console.log("WAITTIMESECONDS is missing.  Set to default of 20.");
		this.WAITTIMESECONDS = 20;
	}

	this.QUEUEURL = 'https://sqs.' + nconf.get('AWS_REGION') + ".amazonaws.com/" + nconf.get('ACCOUNT')  + "/" + nconf.get('QUEUE_PREFIX') + options.queueName;

	AWS.config.update({
		accessKeyId:      nconf.get('AWS_ACCESS_KEY_ID'),
		secretAccessKey:  nconf.get('AWS_SECRET_ACCESS_KEY'),
		region:           nconf.get('AWS_REGION')
	});

	this.handleMessage = options.handleMessage;
	this.sqs = new AWS.SQS();
}

util.inherits(Consumer, EventEmitter);

Consumer.prototype = {

	/* Start polling for messages. */
	start: function () {
		var receiveParams = {
			QueueUrl: this.QUEUEURL,
			MaxNumberOfMessages: this.MAXNUMBEROFMESSAGES,
			WaitTimeSeconds: this.WAITTIMESECONDS
		};

		this.sqs.receiveMessage(receiveParams, this._handleSqsResponse.bind(this));
	},


	_handleSqsResponse: function(err, response) {
  		if (err){
  			this.emit('error', err);
  		}

  		if (response && response.Messages && response.Messages.length > 0) {
    		var message = response.Messages[0];

    		this.emit('message_received', message);
    		this._handleSqsMessage(message);
  		}

  		// Start polling for a new message after the wait time.
		setTimeout(this.start.bind(this), this.WAITTIMESECONDS);
	},

	_handleSqsMessage: function (message) {
  		var consumer = this;

  		this.handleMessage(message, function (err) {
    		if (err) {
    			return consumer.emit('error', err);
    		}

    		consumer._deleteMessage(message);
  		});
	},

	_deleteMessage: function (message) {
		var consumer = this;
		var deleteParams = {
			QueueUrl: this.QUEUEURL,
			ReceiptHandle: message.ReceiptHandle
		};

		this.sqs.deleteMessage(deleteParams, function (err) {
			if (err){
				return consumer.emit('error', err);
			}

			consumer.emit('message_processed', message);
		});
	}
};
module.exports = Consumer;