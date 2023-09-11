"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drink = exports.fun = exports.objectRecord = exports.objectArray = exports.map = exports.localClass = exports.bool = exports.objectVar = exports.arrayLet = exports.numvar = exports.stringVar = void 0;
class LocalClass {
    foo;
    constructor(foo) {
        this.foo = foo;
    }
}
exports.stringVar = 'stringy';
exports.numvar = 123;
exports.arrayLet = [1, 2, 3];
exports.objectVar = { a: 1 };
exports.bool = true;
exports.localClass = new LocalClass('foo');
exports.map = new Map([
    [1, 'one'],
    [2, 'two'],
]);
exports.objectArray = new Object([1, 2, 3]);
exports.objectRecord = new Object({ 1: 'one', 2: 'two', 3: 'three' });
function fun() {
    return null;
}
exports.fun = fun;
const drink = () => 'hangover';
exports.drink = drink;
//# sourceMappingURL=index.js.map