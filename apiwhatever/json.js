'use strict';

/**
 *
 * @param json, could be JsonItem, JsonObject or JsonArray
 * @param mockFunction, fun
 * @returns {*}
 */

function debug(object, msg) {
    console.log('\n-----start-------');
    console.log(object);
    console.log(msg);
    console.log('-----e n d-------')
}

class MockFunction {
    constructor() {
        this.func = null;
        this.params = null;
    }

    call(thisArgs) {
        return this.func.apply(thisArgs, this.params);
    }
}

function raw() {
    let value = this.value;

    if (value === null || value === undefined) {
        return null;
    }

    if (value['toJsonString'] != null && typeof value['toJsonString'] === 'function') {
        return value.toJsonString();
    } else {
        return this.value;
    }
}

class JsonObject {
    /**
     * @param mocker should be one of 'fun' or a piece of script string.
     */
    constructor(template) {
        if (template == null) {
            throw 'Template can\'t be null when new an JsonObject';
        }
        this.children = [];
        this._filter = null;
        this.parent = null;
        this.template = template;
        this.valueHolder = {};
    }

    add(jsonItem) {
        this.children.push(jsonItem);
        jsonItem.parent = this;
    }

    removeChild(childName) {
        let findIndex = -1;
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i];
            if (child.key === childName) {
                findIndex = i;
                break;
            }
        }

        if (findIndex !== -1) {
            this.children[findIndex].silence = true;
        }
    }

    setFilter(func, params) {
        if (this._filter == null) {
            this._filter = new MockFunction();
        }

        this._filter.func = func;
        this._filter.params = params;
    }

    toJsonString() {
        let sb = '{';

        if (this._filter != null) {
            this._filter.call(this);
        }

        let first = true;
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i];

            if (child.silence) {
                continue;
            }

            if (child instanceof JsonItem) {
                if (first) {
                    first = false;
                } else {
                    sb += ', ';
                }
                sb += child.toJsonString();
            }
        }
        sb += '}';
        return sb;
    }

    getParent() {
        return this.parent;
    }

    getValue(key) {
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i];

            if (child.key === key) {
                return child.getValue();
            }
        }
    }

    getTemplate() {
        return this.template;
    }

    getTemplateContext() {
        return this.template.context;
    }
}


class JsonArray {
    constructor(template) {
        if (template == null) {
            throw 'Template can\'t be null when new an JsonArray';
        }
        this.children = [];
        this._filter = null;
        this.parent = null;
        this.template = template;
        this.valueHolder = {};
    }

    add(jsonItem) {
        this.children.push(jsonItem);
        jsonItem.parent = this;
    }

    setFilter(func, params) {
        if (this._filter == null) {
            this._filter = new MockFunction();
        }

        this._filter.func = func;
        this._filter.params = params;
    }

    removeChildAt(index) {
        this.children[index].silence = true;
    }

    toJsonString() {
        let sb = '[';

        if (this._filter != null) {
            this._filter.call(this);
        }


        let first = true;
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i];

            if (child.silence) {
                continue;
            }

            if (first) {
                first = false;
            } else {
                sb += ', ';
            }
            sb += child.toJsonString();

        }
        sb += ']';
        return sb;
    }

    getParent() {
        return this.parent;
    }

    getChildrenCount() {
        return this.children.length;
    }

    getChild(index) {
        if (index >= 0 && index < this.getChildrenCount()) {
            return this.children[index];
        } else {
            return null;
        }
    }

    getTemplate() {
        return this.template;
    }

    getTemplateContext() {
        return this.template.context;
    }
}

class JsonItem {
    constructor(key, template) {
        if (template == null) {
            throw 'Template can\'t be null when new an JsonItem with key=' + key;
        }
        this.key = key;
        this._mocker = new MockFunction();
        this.parent = null;
        this.template = template;
        this.valueHolder = {};
    }

    setMocker(funct, params) {
        if (typeof funct === 'function' && params instanceof Array) {
            this._mocker.func = funct;
            this._mocker.params = params;
            this._loadValue();
        } else {
            throw 'func should be a function, params should be an array, where func=' + (typeof funct) + ', params=' + params;
        }


    }

    setValue(value) {
        this.value = value;
        if (value instanceof JsonObject || value instanceof JsonArray) {
            this.value.parent = this;
        }

        this._mocker.func = raw;
        this._mocker.params = [];

        this._loadValue();
    }

    toJsonString() {
        if (this.key !== null && this.key !== undefined) {
            return '"' + this.valueHolder.key + '" : ' + this.valueHolder.value;
        }
    }

    _loadValue() {
        this.valueHolder.key = this.key;
        this.valueHolder.value = JsonItem._run(this);
    }

    static _run(jsonItem) {
        if (!jsonItem instanceof JsonItem) {
            throw 'jsonItem must be an JsonItem, jsonItem=' + jsonItem;
        }

        let value = null;
        let mocker = jsonItem._mocker;
        value = mocker.call(jsonItem);
        if (typeof value === 'string') {
            return '"' + value + '"';
        } else if (value instanceof JsonArray || value instanceof JsonObject) {
            return value.toJsonString();
        } else {
            return value;
        }
    }

    toString() {
        return this.key;
    }

    getParent() {
        return this.parent;
    }

    getValue() {
        return this.valueHolder.value;
    }

    getKey() {
        return this.key;
    }

    getTemplate() {
        return this.template;
    }

    getTemplateContext() {
        return this.template.context;
    }
}


module.exports = {
    JsonObject: JsonObject, JsonArray: JsonArray, JsonItem: JsonItem
};
