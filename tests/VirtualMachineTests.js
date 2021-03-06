/**
 * Copyright (c) 2013, Dan Eyles (dan@irlgaming.com)
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of IRL Gaming nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL IRL Gaming BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var sculedb = require('../lib/com.scule.db.parser');
var db      = require('../lib/com.scule.db');
var vm      = require('../lib/com.scule.db.vm');
var build   = require('../lib/com.scule.db.builder');
var inst    = require('../lib/com.scule.instrumentation');

exports['test VirtualMachine'] = function(beforeExit, assert) {

    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    collection.save({
        a:1,
        b:2,
        c:3,
        d:4,
        e:5,
        tags:['foo1', 'foo2', 'foo3', 'foo4']
    });

    var table1 = vm.Scule.$d.getHashTable();
    table1.put('foo2', true);
    table1.put('foo4', true);

    var table2 = vm.Scule.$d.getHashTable();
    table2.put(1, true);
    table2.put(2, true);
    table2.put(3, true);
    table2.put(4, true);

    var table3 = vm.Scule.$d.getHashTable();
    table3.put(11, true);
    table3.put(12, true);
    table3.put(13, true);
    table3.put(14, true);

    var program = [
        [0x1C, [collection]], // scan           0
        [0x1A, []], // break point              1 
        [0x23, []], // union                    2
        [0x1A, []], // break point              3
        [0x21, []], // store                    4
        [0x1A, []], // break point              5
        [0x27, []], // read                     6
        [0x1A, []], // break point              7
        [0xC,  ['a', 1]], // eq                 8
        [0x1A, []], // break point              9
        [0xD,  ['e', 7]], // ne                 10
        [0x1A, []], // break point              11
        [0x07, ['b', 1]], // gt                 12
        [0x1A, []], // break point              13
        [0x05, ['b', 3]], // lt                 14
        [0x1A, []], // break point              15
        [0x08, ['c', 1]], // gte                16
        [0x1A, []], // break point              17
        [0x06, ['c', 4]], // lte                18
        [0x1A, []], // break point              19
        [0xA,  ['d', table2]], // in            20
        [0x1A, []], // break point              21
        [0xB,  ['d', table3]], // nin           22
        [0x1A, []], // break point              23
        [0x09, ['tags', table1]], // all        24
        [0x1A, []], // break point              25
        [0xE,  ['tags', 4]], // size            26
        [0x1A, []], // break point              27
        [0xF,  ['e', true]], // exists          28
        [0x1A, []], // break point              29
        [0x01, [11]], // and                    30
        [0x1A, []], // break point              31
        [0x20, []], // shift                    32
        [0x1A, []], // break point              33
        [0x25, [36]], // jump                   34
        [0x26, [6]], // goto                    35
        [0x00, []] // halt                      36
    ];

    var machine = vm.getVirtualMachine();
    machine.execute(program);

    // scan
    assert.equal(machine.stack.getLength(), 1);
    machine.resume();
    
    // union
    assert.equal(machine.stack.getLength(), 1);
    machine.resume();

    // store
    assert.equal(machine.stack.getLength(), 0);
    assert.equal(machine.registers[0].length, 1);
    machine.resume();

    // read
    assert.equal(machine.stack.getLength(), 0);
    assert.equal(false, machine.registers[1] == null);
    machine.resume();
    
    // eq
    assert.equal(machine.stack.getLength(), 1);
    assert.equal(true, machine.stack.peek());
    machine.resume();
    
    // ne
    assert.equal(machine.stack.getLength(), 2);
    assert.equal(true, machine.stack.peek());
    machine.resume();

    // gt
    assert.equal(machine.stack.getLength(), 3);
    assert.equal(true, machine.stack.peek());
    machine.resume();
    
    // lt
    assert.equal(machine.stack.getLength(), 4);
    assert.equal(true, machine.stack.peek());
    machine.resume();

    // gte
    assert.equal(machine.stack.getLength(), 5);
    assert.equal(true, machine.stack.peek());
    machine.resume();
    
    // lte
    assert.equal(machine.stack.getLength(), 6);
    assert.equal(true, machine.stack.peek());
    machine.resume();    
    
    // in
    assert.equal(machine.stack.getLength(), 7);
    assert.equal(true, machine.stack.peek());
    machine.resume();

    // nin
    assert.equal(machine.stack.getLength(), 8);
    assert.equal(true, machine.stack.peek());
    machine.resume();
    
    // all
    assert.equal(machine.stack.getLength(), 9);
    assert.equal(true, machine.stack.peek());
    machine.resume();

    // size
    assert.equal(machine.stack.getLength(), 10);
    assert.equal(true, machine.stack.peek());
    machine.resume();
    
    // exists
    assert.equal(machine.stack.getLength(), 11);
    assert.equal(true, machine.stack.peek());
    machine.resume();    
    
    // and
    assert.equal(machine.stack.getLength(), 1);
    assert.equal(true, machine.stack.peek());
    machine.resume();
    
    // shift
    assert.equal(machine.result.length, 1);
    assert.equal(machine.stack.getLength(), 0);

};

exports['test VirtualMachineSelection'] = function(beforeExit, assert) {

    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    
    for(var i=0; i < 300; i++) {
        var a = [];
        var r = vm.Scule.$f.randomFromTo(2, 5);
        for(var j=0; j < r; j++) {
            a.push(j);
        }
        collection.save({
            a:vm.Scule.$f.randomFromTo(1, 10),
            b:vm.Scule.$f.randomFromTo(1, 10),
            c:vm.Scule.$f.randomFromTo(1, 10),
            d:vm.Scule.$f.randomFromTo(1, 10),
            e:vm.Scule.$f.randomFromTo(1, 10),
            f:a
        });
    }

    var program  = null;
    var result   = null;
    var machine  = vm.getVirtualMachine();
    var compiler = build.getQueryCompiler();
    var timer    = inst.getTimer();

    timer.startInterval('ManualQuery');
    var count = 0;
    var o = collection.findAll();
    o.forEach(function(document) {
        if(document.a == 3 && document.c > 4 && document.c <= 10) {
            count++;
        }
    });
    timer.stopInterval();
    
    timer.startInterval('CompileQuery');
    program  = compiler.compileQuery({a:3, c:{$gt:4, $lte:10}}, {}, collection);
    timer.stopInterval();
    timer.startInterval('ExecuteQuery');
    result   = machine.execute(program);
    timer.stopInterval();
    timer.logToConsole();

    machine.reset();
    timer.resetTimer();
    timer.startInterval('CompileQuery');
    program  = compiler.compileQuery({a:3, c:{$gt:4, $lte:10}}, {}, collection);
    timer.stopInterval();
    timer.startInterval('ExecuteQuery');
    result   = machine.execute(program);
    timer.stopInterval();
    timer.logToConsole();

    machine.reset();
    timer.resetTimer();
    timer.startInterval('CompileQuery');
    program  = compiler.compileQuery({a:3, c:{$gt:4, $lte:10}}, {}, collection);
    timer.stopInterval();
    timer.startInterval('ExecuteQuery');
    result   = machine.execute(program);
    timer.stopInterval();
    timer.logToConsole();

    assert.equal(count, result.length);
};