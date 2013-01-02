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

var vm      = require('../lib/com.scule.db.vm');
var db      = require('../lib/com.scule.db');
var inst    = require('../lib/com.scule.instrumentation');
var jsunit  = require('../lib/com.scule.jsunit');

function testVirtualMachineExecuteInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.registerInstruction(0x42, function(vm, instruction) {
        vm.stack.push(instruction[1][0])
        vm.ipointer++;
    });
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x42, ['lol']]);
    jsunit.assertEquals(machine.stack.peek(), 'lol');
    jsunit.assertEquals(machine.ipointer, 1);
};

function testVirtualMachineHaltInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running = true;
    machine.executeInstruction([0x00, []]);
    jsunit.assertFalse(machine.running);
    jsunit.assertEquals(machine.ipointer, 1);
};

function testVirtualMachineBreakInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running = true;
    machine.executeInstruction([0x1A, []]);
    jsunit.assertFalse(machine.running);
    jsunit.assertEquals(machine.ipointer, 1);    
};

function testVirtualMachineStartInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.executeInstruction([0x24, []]);
    jsunit.assertTrue(machine.running);
    jsunit.assertEquals(machine.ipointer, 1);    
};

function testVirtualMachineScanInstruction() {
    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    collection.ensureBTreeIndex('a', {
        order:100
    });
    for(var i=0; i < 1000; i++) {
        collection.save({
            a:1,
            b:2,
            c:3
        });
    }    
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.executeInstruction([0x1C, [collection]]);
    jsunit.assertEquals(machine.ipointer, 1); 
    jsunit.assertEquals(machine.stack.peek().length, 1000);
};

function testVirtualMachineRangeInstruction() {
    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    collection.ensureBTreeIndex('a', {
        order:100
    });
    for(var i=0; i < 1000; i++) {
        var r = i%10;
        collection.save({
            a:r,
            b:r,
            c:r
        });
    }    
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.executeInstruction([0x1D, [collection.indices[0], [3, 5, true, true]]]);
    jsunit.assertEquals(machine.ipointer, 1); 
    jsunit.assertEquals(machine.stack.peek().length, 300);
};

function testVirtualMachineFindInstruction() {
    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    collection.ensureHashIndex('a', {});
    for(var i=0; i < 1000; i++) {
        var r = i%10;
        collection.save({
            a:r,
            b:r,
            c:r
        });
    }    
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.executeInstruction([0x1B, [collection.indices[0], 2]]);
    jsunit.assertEquals(machine.ipointer, 1); 
    jsunit.assertEquals(machine.stack.peek().length, 100);
};

function testVirtualMachineStoreInstruction() {
    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    collection.ensureHashIndex('a', {});
    for(var i=0; i < 1000; i++) {
        var r = i%10;
        collection.save({
            a:r,
            b:r,
            c:r
        });
    }    
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.executeInstruction([0x1B, [collection.indices[0], 2]]);
    jsunit.assertEquals(machine.ipointer, 1); 
    jsunit.assertEquals(machine.stack.peek().length, 100);
    machine.executeInstruction([0x21, []]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertEquals(machine.registers[0].length, 100);
};

function testVirtualMachineTransposeInstruction() {
    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    collection.ensureHashIndex('a', {});
    for(var i=0; i < 1000; i++) {
        var r = i%10;
        collection.save({
            a:r,
            b:r,
            c:r
        });
    }    
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.executeInstruction([0x1B, [collection.indices[0], 2]]);
    jsunit.assertEquals(machine.ipointer, 1); 
    jsunit.assertEquals(machine.stack.peek().length, 100);
    machine.executeInstruction([0x21, []]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertEquals(machine.registers[0].length, 100);
    machine.executeInstruction([0x28, []]);
    jsunit.assertEquals(machine.ipointer, 3);
    jsunit.assertEquals(machine.result.length, 100);
};

function testVirtualMachineReadInstruction() {
    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    collection.ensureHashIndex('a', {});
    for(var i=0; i < 1000; i++) {
        var r = i%10;
        collection.save({
            a:r,
            b:r,
            c:r
        });
    }    
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.executeInstruction([0x1B, [collection.indices[0], 2]]);
    jsunit.assertEquals(machine.ipointer, 1); 
    jsunit.assertEquals(machine.stack.peek().length, 100);
    machine.executeInstruction([0x21, []]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertEquals(machine.registers[0].length, 100);
    machine.executeInstruction([0x27, []]);
    jsunit.assertEquals(machine.ipointer, 3);
    jsunit.assertEquals(machine.dpointer, 1);
    jsunit.assertEquals(machine.registers[1].a, 2);
};

function testVirtualMachineShiftInstruction() {
    db.dropAll();
    var collection = db.factoryCollection('scule+dummy://unittest');
    collection.ensureHashIndex('a', {});
    for(var i=0; i < 1000; i++) {
        var r = i%10;
        collection.save({
            a:r,
            b:r,
            c:r
        });
    }    
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.executeInstruction([0x1B, [collection.indices[0], 2]]);
    jsunit.assertEquals(machine.ipointer, 1); 
    jsunit.assertEquals(machine.stack.peek().length, 100);
    machine.executeInstruction([0x21, []]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertEquals(machine.registers[0].length, 100);
    machine.executeInstruction([0x27, []]);
    jsunit.assertEquals(machine.ipointer, 3);
    jsunit.assertEquals(machine.dpointer, 1);
    jsunit.assertEquals(machine.registers[1].a, 2);
    machine.stack.push(true);
    machine.executeInstruction([0x20, []]);
    jsunit.assertEquals(machine.ipointer, 4);
    jsunit.assertEquals(machine.dpointer, 1);
    jsunit.assertEquals(machine.registers[1], machine.result[machine.result.length - 1]);
};

function testVirtualMachineIntersectInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    
    var list1 = [];
    var list2 = [];
    
    for(var i=0; i < 1000; i++) {
        var o = {
            _id:db.getObjectId()
        };
        list1.push(o);
        if(i%2 == 0) {
            list2.push(o);
        }
    }
    
    machine.running;
    machine.stack.push(list1);
    machine.stack.push(list2);
    machine.executeInstruction([0x23, []]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(machine.dpointer, 0);
    jsunit.assertEquals(machine.stack.peek().length, 500);
};

function testVirtualMachineAndInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running;
    machine.stack.push(true);
    machine.stack.push(true);
    machine.executeInstruction([0x01, [2]]);
    jsunit.assertTrue(machine.stack.peek());
    machine.stack.push(false);
    machine.executeInstruction([0x01, [2]]);
    jsunit.assertFalse(machine.stack.peek());    
};

function testVirtualMachineOrInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running;
    machine.stack.push(true);
    machine.stack.push(true);
    machine.executeInstruction([0x02, [2]]);
    jsunit.assertTrue(machine.stack.peek());
    machine.stack.push(false);
    machine.executeInstruction([0x02, [2]]);
    jsunit.assertTrue(machine.stack.peek());    
};

function testVirtualMachineGotoInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x26, [42]]); 
    jsunit.assertEquals(machine.ipointer, 42);
};

function testVirtualMachineJumpInstruction() {
    var list = [];
    for(var i=0; i < 100; i++) {
        var o = {
            _id:db.getObjectId()
        };
        list.push(o);
    }    
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running;
    machine.dpointer = 100;
    machine.registers[0] = list;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x25, [42]]); 
    jsunit.assertEquals(machine.ipointer, 42);
    machine.reset();
    machine.running;
    machine.dpointer = 50;
    machine.registers[0] = list;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x25, [42]]);
    jsunit.assertEquals(machine.ipointer, 1);    
};

function testVirtualMachineEqInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xC, ['c.d', 3]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());
};

function testVirtualMachineNeInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xD, ['c.d', 3]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse(machine.stack.peek());
};

function testVirtualMachineGtInstruction() {
    var machine = vm.getVirtualMachine();
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x07, ['c.d', 2]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());

    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x07, ['c.d', 3]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse(machine.stack.peek());    
};

function testVirtualMachineGteInstruction() {
    var machine = vm.getVirtualMachine();
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x08, ['c.d', 2]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());

    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x08, ['c.d', 3]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());    
};

function testVirtualMachineLtInstruction() {
    var machine = vm.getVirtualMachine();
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x05, ['c.d', 4]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());

    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x05, ['c.d', 3]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse(machine.stack.peek());    
};

function testVirtualMachineLteInstruction() {
    var machine = vm.getVirtualMachine();
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x06, ['c.d', 4]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());

    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x06, ['c.d', 3]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());    
};

function testVirtualMachineInInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    var table = db.Scule.$d.getHashTable();
    table.put(1, true);
    table.put(3, true);
    table.put(4, true);
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xA, ['c.d', table]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xA, ['c', table]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse(machine.stack.peek());    
};

function testVirtualMachineNinInstruction() {
    var machine = vm.getVirtualMachine();
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    var table = db.Scule.$d.getHashTable();
    table.put(1, true);
    table.put(3, true);
    table.put(4, true);
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xB, ['c.d', table]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse(machine.stack.peek());
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a: 1,
        b: 2,
        c: {
            d:3
        }
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xB, ['c', table]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());    
};

function testVirtualMachineSizeInstruction() {
    var machine = vm.getVirtualMachine();
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a:[1, 2, 3, 4, 5, 6, 7]
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xE, ['a', 7]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a:[1, 2, 3, 4, 5, 6, 7]
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xE, ['a', 5]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse(machine.stack.peek());    
};

function testVirtualMachineExistsInstruction() {
    var machine = vm.getVirtualMachine();
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a:[1, 2, 3, 4, 5, 6, 7]
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xF, ['a', true]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a:[1, 2, 3, 4, 5, 6, 7]
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0xF, ['c', true]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse(machine.stack.peek());    
};

function testVirtualMachineAllInstruction() {
    var machine = vm.getVirtualMachine();
    var table = db.Scule.$d.getHashTable();
    table.put('foo', true);
    table.put('bar', true);
    
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a:['foo', 'bar', 'poo']
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x09, ['a', table]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertTrue(machine.stack.peek());
    
    table.put('lol');
    machine.reset();
    machine.running;
    machine.registers[1] = {
        a:['foo', 'bar', 'poo']
    };
    jsunit.assertEquals(machine.ipointer, 0);
    jsunit.assertTrue(machine.stack.isEmpty());
    machine.executeInstruction([0x09, ['c']]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse(machine.stack.peek());    
};

function testVirtualMachineLimitInstruction() {
    var machine = vm.getVirtualMachine();
    for(var i=0; i < 1000; i++) {
        machine.result.push({
            _id:db.getObjectId()
        });
    }
    jsunit.assertEquals(machine.ipointer, 0);    
    machine.executeInstruction([0x29, [97]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(machine.result.length, 97);
}

function testVirtualMachineSetInstruction() {
    var machine = vm.getVirtualMachine();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar'
    };
    
    machine.running = true;
    machine.upsert  = false;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x12, [{
        foo:true
    }, 'lol']]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(machine.registers[1].foo, 'lol');
    machine.executeInstruction([0x12, [{
        bar:true
    }, 'foo']]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertFalse(('bar' in machine.registers[1]));

    machine.reset();
    machine.running = true;
    machine.upsert  = true;
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar'
    };    
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x12, [{
        foo:true
    }, 'lol']]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(machine.registers[1].foo, 'lol');
    machine.executeInstruction([0x12, [{
        bar:true
    }, 'foo']]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertEquals(machine.registers[1].bar, 'foo');
};

function testVirtualMachineUnsetInstruction() {
    var machine = vm.getVirtualMachine();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar'
    };
    
    machine.running = true;
    machine.upsert  = false;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x13, [{
        foo:true
    }]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertFalse('foo' in machine.registers[1]);
};

function testVirtualMachineIncInstruction() {
    
    var machine = vm.getVirtualMachine();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar',
        count:0
    };
    
    machine.running = true;
    machine.upsert  = false;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x14, [{
        foo:true
    }, 2]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(machine.registers[1].foo, 'bar');
    machine.executeInstruction([0x14, [{
        count:true
    }, 2]]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertEquals(machine.registers[1].count, 2);

    machine.reset();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar',
        count:0
    };
    
    machine.running = true;
    machine.upsert  = true;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x14, [{
        count1:true
    }, 66]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(machine.registers[1].count1, 66);
    
};

function testVirtualMachineOPullInstruction() {
    var machine = vm.getVirtualMachine();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar',
        arr:['foo', 'bar', 'poo']
    };
    machine.running = true;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x15, [{
        arr:true
    }, 'poo']]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(JSON.stringify(machine.registers[1].arr), JSON.stringify(['foo', 'bar']));
};

function testVirtualMachineOPullAllInstruction() {
    var machine = vm.getVirtualMachine();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar',
        arr:['foo', 'bar', 'poo']
    };
    machine.running = true;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x16, [{
        arr:true
    }, ['poo', 'foo']]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(JSON.stringify(machine.registers[1].arr), JSON.stringify(['bar']));
};

function testVirtualMachinePopInstruction() {
    var machine = vm.getVirtualMachine();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar',
        arr:['foo', 'bar', 'poo']
    };
    machine.running = true;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x17, [{
        arr:true
    }]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(JSON.stringify(machine.registers[1].arr), JSON.stringify(['foo', 'bar']));
    machine.executeInstruction([0x17, [{
        arr:true
    }]]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertEquals(JSON.stringify(machine.registers[1].arr), JSON.stringify(['foo']));
};

function testVirtualMachineOPushInstruction() {
    var machine = vm.getVirtualMachine();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar',
        arr:['foo', 'bar', 'poo']
    };
    machine.running = true;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x18, [{
        arr:true
    }, 'poo']]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(JSON.stringify(machine.registers[1].arr), JSON.stringify(['foo', 'bar', 'poo', 'poo']));
    machine.executeInstruction([0x18, [{
        arr:true
    }, 'poo2']]);
    jsunit.assertEquals(machine.ipointer, 2);
    jsunit.assertEquals(JSON.stringify(machine.registers[1].arr), JSON.stringify(['foo', 'bar', 'poo', 'poo', 'poo2']));    
};

function testVirtualMachineOPushAllInstruction() {
    var machine = vm.getVirtualMachine();
    machine.registers[1] = {
        _id:db.getObjectId(),
        foo:'bar',
        arr:['foo', 'bar', 'poo']
    };
    machine.running = true;
    jsunit.assertEquals(machine.ipointer, 0);
    machine.executeInstruction([0x19, [{
        arr:true
    }, ['poo', 'foo']]]);
    jsunit.assertEquals(machine.ipointer, 1);
    jsunit.assertEquals(JSON.stringify(machine.registers[1].arr), JSON.stringify(['foo', 'bar', 'poo', 'poo', 'foo']));
};

(function() {
    jsunit.resetTests(__filename);
    jsunit.addTest(testVirtualMachineExecuteInstruction);
    jsunit.addTest(testVirtualMachineHaltInstruction);
    jsunit.addTest(testVirtualMachineBreakInstruction);
    jsunit.addTest(testVirtualMachineStartInstruction);
    jsunit.addTest(testVirtualMachineScanInstruction);
    jsunit.addTest(testVirtualMachineRangeInstruction);
    jsunit.addTest(testVirtualMachineFindInstruction);
    jsunit.addTest(testVirtualMachineStoreInstruction);
    jsunit.addTest(testVirtualMachineTransposeInstruction);
    jsunit.addTest(testVirtualMachineReadInstruction);
    jsunit.addTest(testVirtualMachineShiftInstruction);
    jsunit.addTest(testVirtualMachineIntersectInstruction);
    jsunit.addTest(testVirtualMachineAndInstruction);
    jsunit.addTest(testVirtualMachineOrInstruction);
    jsunit.addTest(testVirtualMachineGotoInstruction);
    jsunit.addTest(testVirtualMachineJumpInstruction);
    jsunit.addTest(testVirtualMachineEqInstruction);
    jsunit.addTest(testVirtualMachineNeInstruction);
    jsunit.addTest(testVirtualMachineGtInstruction);
    jsunit.addTest(testVirtualMachineGteInstruction);
    jsunit.addTest(testVirtualMachineLtInstruction);
    jsunit.addTest(testVirtualMachineLteInstruction);
    jsunit.addTest(testVirtualMachineInInstruction);
    jsunit.addTest(testVirtualMachineNinInstruction);
    jsunit.addTest(testVirtualMachineSizeInstruction);
    jsunit.addTest(testVirtualMachineExistsInstruction);
    jsunit.addTest(testVirtualMachineAllInstruction);
    jsunit.addTest(testVirtualMachineLimitInstruction);
    jsunit.addTest(testVirtualMachineSetInstruction);
    jsunit.addTest(testVirtualMachineUnsetInstruction);
    jsunit.addTest(testVirtualMachineIncInstruction);
    jsunit.addTest(testVirtualMachineOPullInstruction);
    jsunit.addTest(testVirtualMachineOPullAllInstruction);
    jsunit.addTest(testVirtualMachinePopInstruction);
    jsunit.addTest(testVirtualMachineOPushInstruction);
    jsunit.addTest(testVirtualMachineOPushAllInstruction);
    jsunit.runTests();
}());