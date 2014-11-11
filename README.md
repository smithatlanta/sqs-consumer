# sqs-consumer

Taken from https://github.com/robinjmurphy/sqs-consumer.git and molded to my needs

## Usage

```js

var Consumer = require('sqs-consumer');

var app = new Consumer({
  queueName: '',
  handleMessage: function (message, done) {
    // do some work with `message`
    done();
  }
});

app.start();
```

* The queue is polled continuously for messages using [long polling](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-long-polling.html).
* Messages are deleted from the queue once `done()` is called.
* Calling `done(err)` with an error object will cause the message to be left on the queue. An [SQS redrive policy](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/SQSDeadLetterQueue.html) can be used to move messages that cannot be processed to a dead letter queue.

## API

### `new Consumer(options)`

Creates a new SQS consumer.

#### Options

* `queueName` - _String_ - The SQS queue URL
* `handleMessage` - _Function_ - A function to be called whenever a message is receieved. Receives an SQS message object as its first argument and a function to call when the message has been handled as its second argument (i.e. `handleMessage(message, done)`).
* `waitTime` - _Number_ - An optional time in milliseconds to wait after recieving a message before requesting another one. This enables you to throttle the rate at which messages will be received. (default `100`);

### `consumer.start()`

Expects a config.json file similar to this:

{
    "AWS_ACCESS_KEY_ID": "",
    "AWS_SECRET_ACCESS_KEY": "",
    "AWS_REGION": "us-east-1",
    "QUEUE_PREFIX": "us_east_",
    "ACCOUNT": "",
    "WAITTIMESECONDS": 20,
    "MAXNUMBEROFMESSAGES":1
}

or you can set environment vars or pass to node via --

Start polling the queue for messages.

### Events

Each consumer is an [`EventEmitter`](http://nodejs.org/api/events.html) and emits the following events:

|Event|Params|Description|
|-----|------|-----------|
|`error`|`err`|Fired when an error occurs interacting with the queue or processing the message.|
|`message_received`|`message`|Fired when a message is received.|
|`message_processed`|`message`|Fired when a message is successfully processed and removed from the queue.|