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

'use strict';

var
expect = require('chai').expect;

var
bloem = require('..');

describe('bloem', function () {

  describe('.SeqHoos', function () {
    var
    hoos;

    beforeEach(function () {
      hoos = new bloem.SeqHoos();
    });

    it('should return new instance without `new\'', function () {
      expect(bloem.SeqHoos()).to.be.an.instanceOf(bloem.SeqHoos);
    });

    it('should call `connect\' method.', function () {
      expect(hoos).to.respondTo('connect');
    });

    describe('#onData', function () {

      it('should call passed function via `Pomp#send\'.', function (done) {
        var
        data = ['data'],
        pomp = new bloem.Pomp(),
        hoos = new bloem.SeqHoos(function (err, result) {
          expect(err).to.be.null;
          expect(result).to.equal(data);
          done();
        });
        pomp.connect(hoos);

        pomp.send(data);
      });

      it('should call passed function via `Pomp#raise\'.', function (done) {
        var
        data = ['data'],
        pomp = new bloem.Pomp(),
        hoos = new bloem.SeqHoos(function (err) {
          expect(err).to.equal(data);
          done();
        });
        pomp.connect(hoos);

        pomp.raise(data);
      });

      it('should call passed function via `Pomp#sendSync\'.', function () {
        var
        data = ['data'],
        pomp = new bloem.Pomp(),
        hoos = new bloem.SeqHoos(function (err, result) {
          expect(err).to.be.null;
          expect(result).to.equal(data);
        });
        pomp.connect(hoos);

        pomp.sendSync(data);
      });

      it('should call passed function via `Pomp#raiseSync\'', function () {
        var
        data = ['data'],
        pomp = new bloem.Pomp(),
        hoos = new bloem.SeqHoos(function (err) {
          expect(err).to.equal(data);
        });
        pomp.connect(hoos);

        pomp.raiseSync(data);
      });

    });
  });

});
