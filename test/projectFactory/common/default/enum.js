"use strict";
var defaultEnum;
(function (defaultEnum) {
    defaultEnum[defaultEnum["one"] = 0] = "one";
    defaultEnum[defaultEnum["two"] = 1] = "two";
    defaultEnum[defaultEnum["three"] = 2] = "three";
})(defaultEnum || (defaultEnum = {}));
module.exports = defaultEnum;
