QUnit.module('Controlled');

var TestScheduler = Rx.TestScheduler,
  onNext = Rx.ReactiveTest.onNext,
  onError = Rx.ReactiveTest.onError,
  onCompleted = Rx.ReactiveTest.onCompleted,
  subscribe = Rx.ReactiveTest.subscribe;

test('controlled gets some values', function () {
  var subscription;

  var scheduler = new TestScheduler();

  var results = scheduler.createObserver();

  var xs = scheduler.createHotObservable(
    onNext(150, 1),
    onNext(210, 2),
    onNext(230, 3),
    onNext(301, 4),
    onNext(350, 5),
    onNext(399, 6),
    onCompleted(500)
  );

  var controlled = xs.controlled();

  scheduler.scheduleAbsolute(200, function () {
    subscription = controlled.subscribe(results);
  });

  scheduler.scheduleAbsolute(400, function () {
    controlled.request(5);
  });

  scheduler.scheduleAbsolute(1000, function () {
      subscription.dispose();
  });

  scheduler.start();

  results.messages.assertEqual(
    onNext(400, 2),
    onNext(400, 3),
    onNext(400, 4),
    onNext(400, 5),
    onNext(400, 6),
    onCompleted(500)
  );
});

test('controlled gets two sets of values', function () {
  var subscription;

  var scheduler = new TestScheduler();

  var results = scheduler.createObserver();

  var xs = scheduler.createHotObservable(
    onNext(150, 1),
    onNext(210, 2),
    onNext(230, 3),
    onNext(301, 4),
    onNext(350, 5),
    onNext(399, 6),
    onCompleted(500)
  );

  var controlled = xs.controlled();

  scheduler.scheduleAbsolute(200, function () {
    subscription = controlled.subscribe(results);
  });

  scheduler.scheduleAbsolute(400, function () {
    controlled.request(3);
  });

  scheduler.scheduleAbsolute(450, function () {
    controlled.request(2);
  });

  scheduler.scheduleAbsolute(1000, function () {
      subscription.dispose();
  });

  scheduler.start();

  results.messages.assertEqual(
    onNext(400, 2),
    onNext(400, 3),
    onNext(400, 4),
    onNext(450, 5),
    onNext(450, 6),
    onCompleted(500)
  );
});

test('controlled fires on completed', function(){

    var scheduler = new TestScheduler();
    var results = scheduler.createObserver();

    var source = Rx.Observable.range(1, 2).controlled();

    scheduler.scheduleAbsolute(200, function(){
        source.subscribe(results);
    });

    scheduler.scheduleAbsolute(300, function () {
        source.request(3);
    });

    scheduler.start();

    results.messages.assertEqual(
        onNext(300, 1),
        onNext(300, 2),
        onCompleted(300)
    );
});

test('controlled cancels inflight request', function(){

    var scheduler = new TestScheduler();

    var source = scheduler.createHotObservable(
        onNext(400, 2),
        onNext(410, 3),
        onNext(420, 4)
    ).controlled();

    var results = scheduler.createObserver();

    scheduler.scheduleAbsolute(200, function(){
        source.request(3);
    });

    scheduler.scheduleAbsolute(200, function(){
        source.request(2);
    });

    scheduler.scheduleAbsolute(300, function(){
        source.subscribe(results);
    });

    scheduler.advanceBy(420);


    results.messages.assertEqual(
        onNext(400, 2),
        onNext(410, 3)
    );


});

test('controlled fires onError', function(){

    var scheduler = new TestScheduler();
    var results = scheduler.createObserver();

    var error = new Error("expected");
    var source = Rx.Observable.range(1, 2, scheduler)
        .concat(Rx.Observable.throw(error, scheduler))
        .controlled();

    scheduler.scheduleAbsolute(200, function(){
        source.subscribe(results);
    });


    scheduler.scheduleAbsolute(300, function () {
        source.request(3);
    });

    scheduler.start();

    results.messages.assertEqual(
        onNext(300, 1),
        onNext(300, 2),
        onError(300, error)
    );

});

test('controlled drops messages with queue disabled', function(){

    var scheduler = new TestScheduler();

    var source = scheduler.createHotObservable(
        onNext(400, 1),
        onNext(410, 2),
        onNext(420, 3),
        onNext(430, 4),
        onCompleted(500)
    ).controlled(false);

    var results = scheduler.createObserver();


    scheduler.scheduleAbsolute(415, function(){
        source.request(2);
    });

    scheduler.scheduleAbsolute(200, function(){
        source.subscribe(results);
    });

    scheduler.start();

    results.messages.assertEqual(
      onNext(420, 3),
      onNext(430, 4),
      onCompleted(500)
    );


});