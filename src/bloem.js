// bloem.js - Processing events and actions like Gardening in JavaScript.

// Copyright 2014-2015 TSUYUSATO Kitsune
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


(function defineBloem(
  global
) {
'use strict';

var
bloem; // namespace

// if Node.js or Browserify
/* istanbul ignore else */
if (typeof module !== 'undefined' && 'exports' in module) {
  bloem = module.exports;

// otherwise (Browser, WebWorker...)
} else {
  bloem = global.bloem = {};
}


// utility function
var
setImmediate = typeof global.setImmediate === 'function' ? global.setImmediate : /* istanbul ignore next */ function setImmediatePolyfill(fn) {
  return setTimeout(fn, 0);
};

// abstract class Connecter
// `Pomp` and `Hoos`'s super class

function Connecter() {
  if (this.constructor === Connecter) {
    throw Error('Can\'t make instance. Connecter is abstract class!');
  }

  this._targets = [];
  this._head = this;
}

// methods of class Connecter

Connecter.inherits = function inherits(ctor, clazz) {
  ctor.prototype = Object.create((clazz || Connecter).prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
};

Connecter.prototype.connect = function connect(target) {
  target = Object.create(target);

  this._targets.push(target._head || target);
  target._head = this._head;

  return target;
};

// delegate pomp method

'send sendSync'.split(' ').forEach(function loop(name) {
  Connecter.prototype[name] = function syncDelegate(data) {
    (this._head || this)[name](data);
  };
  Connecter.prototype[name].displayName = name;
});

'raise raiseSync'.split(' ').forEach(function loop(name) {
  Connecter.prototype[name] = function raiseDelegate(err) {
    (this._head || this)[name](err);
  };
  Connecter.prototype[name].displayName = name;
});

'sendAndRaise sendAndRaiseSync'.split(' ').forEach(function loop(name) {
  Connecter.prototype[name] = function sendAndRaiseDelegate(err, data) {
    (this._head || this)[name](err, data);
  };
  Connecter.prototype[name].displayName = name;
});




// medthods

// class Pomp
// `Pomp' in Dutch means `Pump' in English.

function Pomp() {
  if (!(this instanceof Pomp)) return new Pomp();

  Connecter.call(this);
}

Connecter.inherits(Pomp);

// methods of class Pomp

Pomp.prototype.sendAndRaiseSync = function sendAndRaiseSync(error, data) {
  this._targets.forEach(function loop(target) {
    target.onData(error, data);
  });
  return this;
};

Pomp.prototype.sendAndRaise = function sendAndRaise(error, data) {
  setImmediate(this.sendAndRaiseSync.bind(this, error, data));
  return this;
};

Pomp.prototype.sendSync = function sendSync(data) {
  return this.sendAndRaiseSync(null, data);
};

Pomp.prototype.send = function send(data) {
  return this.sendAndRaise(null, data);
};

Pomp.prototype.raiseSync = function raiseSync(error) {
  return this.sendAndRaiseSync(error, null);
};

Pomp.prototype.raise = function raise(error) {
  return this.sendAndRaise(error, null);
};


// class Hoos
// `Hoos' in Dutch means `hose' in English.

function Hoos(handler) {
  if (!(this instanceof Hoos)) return new Hoos(handler);
  Connecter.call(this);

  this._handler = handler;
}

Connecter.inherits(Hoos);

// methods of class Hoos

Hoos.prototype.onData = function onData(error, data) {
  this._handler(error, data, function next(error, data) {
    this._targets.forEach(function loop(target) {
      target.onData(error, data);
    });
  }.bind(this));
};


// class LimitedHoos
// Limited Hoos.

function LimitedHoos(limit, handler) {
  if (!(this instanceof LimitedHoos)) return new LimitedHoos(limit, handler);
  Hoos.call(this, handler);

  this.limit = limit;
  this._queue = [];
}

Connecter.inherits(LimitedHoos, Hoos);

// methods of class LimitedHoos

LimitedHoos.prototype.onData = function onData(error, data) {
  this._queue.push([error, data]);

  if (this._queue.length <= this.limit) {
    this._sendData();
  }
};

LimitedHoos.prototype._sendData = function _sendData() {
  var
  i = Math.min(this.limit - 1, this._queue.length - 1);

  this._handler(this._queue[i][0], this._queue[i][1], function next(error, data) {
    this._targets.forEach(function loop(target) {
      target.onData(error, data);
    });

    this._queue.shift();
    if (this._queue.length >= 1) {
      this._sendData();
    }
  }.bind(this));
};


// class Tuin
// `Tuin' in Dutch means `Garden' in English.
function Tuin(handler) {
  if (!(this instanceof Tuin)) return new Tuin(handler);

  this._handler = handler;
}

// methods of class Tuin

Tuin.prototype.onData = function onData(error, data) {
  this._handler(error, data);
};


// exports classes

bloem.Connecter = Connecter;
bloem.Pomp = Pomp;
bloem.Hoos = Hoos;
bloem.LimitedHoos = LimitedHoos;
bloem.Tuin = Tuin;


// utility functions of bloem namespace

var
slice = Array.prototype.slice,
wrapIter = bloem.wrapIter = function wrapIter(iter, baseLength, resultLength) {
  baseLength = typeof baseLength === 'undefined' ? 1 : baseLength;
  resultLength = typeof resultLength === 'undefined' ? 1 : resultLength;

  return iter.length > baseLength ? iter :
    function wrappedIter() {
      var
      originArgs = slice.apply(arguments),
      args = originArgs.slice(0, baseLength),
      next = originArgs[baseLength],
      result;

      try {
        result = iter.apply(this, args);
      } catch (error) {
        return next(error);
      }

      if (resultLength <= 1) {
        next(null, result);
      } else {
        next.apply(null, [null].concat(result));
      }
    };
};

bloem.use = function use(mixin, bloemExtendFlag) {
  Object.keys(mixin).forEach(function (key) {
    if (bloemExtendFlag) {
      bloem[key] = mixin[key];
    }

    Connecter.prototype[key] = function mixinEnumerable() {
      return this.connect(mixin[key].apply(null, arguments));
    };
    // for debugging
    Connecter.prototype[key].displayName = key;
  });

  return bloem;
};

// creator functions of bloem namespace

bloem.identity = function identity() {
  return new Hoos(function handler(error, data, next) {
    next(error, data);
  });
};

bloem.fromArray = function fromArray(array) {
  var
  pomp = new Pomp();

  pomp.send(0);
  return pomp.connect(new Hoos(function handler(_, i, next) {
    if (i < array.length) {
      pomp.send(i + 1);
      next(null, array[i]);
    }
  }));
};

bloem.merge = function merge() {
  var
  hoos = bloem.identity(),
  i, len = arguments.length;

  for (i = 0; i < len; i++) {
    arguments[i].connect(hoos);
  }

  return hoos;
};

// mixin Enumerable
var
Enumerable = {};

Enumerable.map = function map(iter) {
  iter = wrapIter(iter);

  return new Hoos(function handler(error, data, next) {
    if (error !== null) return next(error);
    iter(data, next);
  });
};

Enumerable.filter = function filter(iter) {
  iter = wrapIter(iter);

  return new Hoos(function handler(error, data, next) {
    if (error !== null) return next(error);
    iter(data, function filterNext(error, flag) {
      if (error !== null) return next(error);
      if (flag) {
        next(null, data);
      }
    });
  });
};

Enumerable.reduce = function reduce(iter, init) {
  iter = wrapIter(iter, 2);

  var
  state = init;

  return new LimitedHoos(1, function handler(error, data, next) {
    if (error !== null) return next(error);
    iter(state, data, function reduceNext(error, update) {
      if (error !== null) return next(error);
      state = update;
      next(null, state);
    });
  });
};

Enumerable.forEach = function forEach(iter) {
  return new Tuin(function handler(error, data) {
    if (error) return;
    iter(data);
  });
};

Enumerable.flatMap = function flatMap(iter) {
  iter = wrapIter(iter);

  return new Hoos(function handler(error, data, next) {
    if (error !== null) return next(error);
    iter(data, function flatMapNext(error, target) {
      if (error !== null) return next(error);
      target.connect(new Hoos(next));
    });
  });
};

Enumerable.rescue = function rescue(iter, dataNextFlag) {
  if (!iter) {
    iter = function throughIter(error, next) {
      next(null, error);
    };
  }
  iter = wrapIter(iter);

  return new Hoos(function handler(error, data, next) {
    if (error !== null) return iter(error, next);
    if (dataNextFlag) return next(null, data);
  });
};

Enumerable.when = function when(cond, then, otherwise) {
  cond = wrapIter(cond);
  then = wrapIter(then);
  otherwise = wrapIter(otherwise);

  return new Hoos(function handler(error, data, next) {
    if (error !== null) return next(error);
    cond(data, function whenNext(error, condition) {
      if (error !== null) return next(error);
      if (condition) {
        then(data, next);
      } else {
        otherwise(data, next);
      }
    });
  });
};

Enumerable.reduceMap = function (iter, init) {
  iter = wrapIter(iter, 2, 2);

  var
  state = init;

  return new LimitedHoos(1, function handler(error, data, next) {
    if (error !== null) return next(error);
    iter(state, data, function iterNext(error, update, result) {
      if (error !== null) return next(error);
      state = update;
      next(null, result);
    });
  });
};


// mix Enumerable to bloem and Pomp and Hoos
bloem.use(Enumerable, true);

// export Enumerable for testing
bloem.Enumerable = Enumerable;


})((this || /* istanbul ignore next */ 0).self || global);
