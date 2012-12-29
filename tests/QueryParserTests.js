var sculedb = require('../lib/com.scule.db.parser');
var inst    = require('../lib/com.scule.instrumentation');
var jsunit  = require('../lib/com.scule.jsunit');

function testQuerySymbol() {
    
    var symbol = sculedb.getQuerySymbol('foo', 8);
    jsunit.assertEquals(symbol.getSymbol(), 'foo');
    jsunit.assertEquals(symbol.getType(), 8);
    
    symbol.setSymbol('bar');
    symbol.setType(1);
    
    jsunit.assertEquals(symbol.getSymbol(), 'bar');
    jsunit.assertEquals(symbol.getType(), 1);
    jsunit.assertFalse(symbol.hasChildren());
    
    symbol.addChild(sculedb.getQuerySymbol('foo', 8));
    
    jsunit.assertTrue(symbol.hasChildren());
    jsunit.assertEquals(symbol.getFirstChild(), symbol.getChild(0));
    
    symbol.addChild(sculedb.getQuerySymbol('foo1', 8));
    
    jsunit.assertEquals(symbol.getFirstChild(), symbol.getChild(0));
    jsunit.assertNotEquals(symbol.getFirstChild(), symbol.getChild(1));
    
    symbol.addChild(sculedb.getQuerySymbol('$and', 2));
    
    jsunit.assertEquals(symbol.getChild(2).getType(), 2);
    jsunit.assertEquals(symbol.getChild(2).getSymbol(), '$and');
    jsunit.assertEquals(symbol.children.length, 3);
    
    symbol.normalize();
    
    jsunit.assertEquals(symbol.children.length, 2);
};

function testQueryTree() {
 
    var tree = sculedb.getQueryTree();
 
    jsunit.assertEquals(tree.getRoot(), null);
    
    var node = sculedb.getQuerySymbol('foo', 8);
    tree.setRoot(node);
    
    jsunit.assertEquals(tree.getRoot(), node);

    tree.getRoot().addChild(sculedb.getQuerySymbol('$and', 2));
    
    jsunit.assertTrue(tree.getRoot().hasChildren());
    
    tree.normalize();

    jsunit.assertFalse(tree.getRoot().hasChildren());
};

function testQueryParser() {

    var parser = sculedb.getQueryParser();
    var tree   = parser.parseQuery({a:1, b:2});
    
    jsunit.assertEquals(tree.getRoot().getType(), -1); // should be an expression
    
    jsunit.assertEquals(tree.getRoot().getChild(0).getType(), 8);
    jsunit.assertEquals(tree.getRoot().getChild(0).getSymbol(), 'a');
    jsunit.assertEquals(tree.getRoot().getChild(1).getType(), 8);
    jsunit.assertEquals(tree.getRoot().getChild(1).getSymbol(), 'b');
    
    jsunit.assertEquals(tree.getRoot().getChild(0).getFirstChild().getType(), 1);
    jsunit.assertEquals(tree.getRoot().getChild(0).getFirstChild().getSymbol(), '$eq');
    jsunit.assertEquals(tree.getRoot().getChild(1).getFirstChild().getType(), 1);
    jsunit.assertEquals(tree.getRoot().getChild(1).getFirstChild().getSymbol(), '$eq');    

    jsunit.assertEquals(tree.getRoot().getChild(0).getFirstChild().getFirstChild().getType(), 9);
    jsunit.assertEquals(tree.getRoot().getChild(0).getFirstChild().getFirstChild().getSymbol(), 1);
    jsunit.assertEquals(tree.getRoot().getChild(1).getFirstChild().getFirstChild().getType(), 9);
    jsunit.assertEquals(tree.getRoot().getChild(1).getFirstChild().getFirstChild().getSymbol(), 2); 

};

function testQueryParserNormalization() {

    var parser = sculedb.getQueryParser();
    var tree   = parser.parseQuery({a:1, b:2, $or:[{a:2, b:3}, {a:3, b:4}], $and:[{c:11}, {$or:[{a:4, b:5}, {a:5, b:6}]}, {$or:[{a:6, b:7}, {a:7, b:8}]}]});

    jsunit.assertEquals(tree.getRoot().getType(), -1); // should be an expression
    
    jsunit.assertEquals(tree.getRoot().getChild(0).getType(), 8);
    jsunit.assertEquals(tree.getRoot().getChild(0).getSymbol(), 'a');
    jsunit.assertEquals(tree.getRoot().getChild(1).getType(), 8);
    jsunit.assertEquals(tree.getRoot().getChild(1).getSymbol(), 'b');
    jsunit.assertEquals(tree.getRoot().getChild(2).getType(), 8);
    jsunit.assertEquals(tree.getRoot().getChild(2).getSymbol(), 'c');
    
    jsunit.assertEquals(tree.getRoot().getChild(0).getFirstChild().getType(), 1);
    jsunit.assertEquals(tree.getRoot().getChild(0).getFirstChild().getSymbol(), '$eq');
    jsunit.assertEquals(tree.getRoot().getChild(1).getFirstChild().getType(), 1);
    jsunit.assertEquals(tree.getRoot().getChild(1).getFirstChild().getSymbol(), '$eq');    
    jsunit.assertEquals(tree.getRoot().getChild(2).getFirstChild().getType(), 1);
    jsunit.assertEquals(tree.getRoot().getChild(2).getFirstChild().getSymbol(), '$eq');

    jsunit.assertEquals(tree.getRoot().getChild(0).getFirstChild().getFirstChild().getType(), 9);
    jsunit.assertEquals(tree.getRoot().getChild(0).getFirstChild().getFirstChild().getSymbol(), 1);
    jsunit.assertEquals(tree.getRoot().getChild(1).getFirstChild().getFirstChild().getType(), 9);
    jsunit.assertEquals(tree.getRoot().getChild(1).getFirstChild().getFirstChild().getSymbol(), 2);
    jsunit.assertEquals(tree.getRoot().getChild(2).getFirstChild().getFirstChild().getType(), 9);
    jsunit.assertEquals(tree.getRoot().getChild(2).getFirstChild().getFirstChild().getSymbol(), 11);

    jsunit.assertEquals(tree.getRoot().getChild(3).getType(), 2);
    jsunit.assertEquals(tree.getRoot().getChild(3).children.length, 3);
    
    tree.getRoot().getChild(3).children.forEach(function(child) {
        jsunit.assertEquals(child.getType(), 2);
        jsunit.assertEquals(child.getFirstChild().getType(), 2);
        child.getFirstChild().children.forEach(function(subChild) {
            jsunit.assertEquals(subChild.getType(), 8);
            jsunit.assertEquals(subChild.getFirstChild().getType(), 1);
            jsunit.assertEquals(subChild.getFirstChild().getFirstChild().getType(), 9);
        });
    });
};

function testQueryParserNestingError() {
    
    var parser = sculedb.getQueryParser();
    
    var flag = false;
    try {
        parser.parseQuery({a:1, $and:[{b:2}]});
    } catch (e) {
        flag = true;
    }
    jsunit.assertTrue(flag);
    
    flag = false;
    try {
        parser.parseQuery({a:1, $and:[{b:2},{c:2}]});
    } catch (e) {
        flag = true;
    }
    jsunit.assertFalse(flag);

    flag = false;
    try {
        parser.parseQuery({a:1, $or:[{b:2}]});
    } catch (e) {
        flag = true;
    }
    jsunit.assertTrue(flag);

    flag = false;
    try {
        parser.parseQuery({a:1, $and:[{b:2},{c:2},{$and:[{d:3},{e:4}]}]});
    } catch (e) {
        flag = true;
    }
    jsunit.assertTrue(flag);    

    flag = false;
    try {
        parser.parseQuery({a:1, $and:[{b:2},{c:2},{$or:[{d:3},{e:4}]}]});
    } catch (e) {
        flag = true;
    }
    jsunit.assertFalse(flag);

    flag = false;
    try {
        parser.parseQuery({a:1, $or:[{b:2},{c:2},{$or:[{d:3},{e:4}]}]});
    } catch (e) {
        flag = true;
    }
    jsunit.assertTrue(flag);
};

(function() {
    jsunit.resetTests(__filename);
    jsunit.addTest(testQuerySymbol);
    jsunit.addTest(testQueryTree);
    jsunit.addTest(testQueryParser);
    jsunit.addTest(testQueryParserNormalization);
    jsunit.addTest(testQueryParserNestingError);
    jsunit.runTests();
}());