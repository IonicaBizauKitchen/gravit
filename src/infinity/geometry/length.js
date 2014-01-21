(function (_) {
    /**
     * A class representing a unit with a value
     * @param {Number} value
     * @param {GXLength.Unit} [unit] the unit unit, defaults to GXLength.Unit.PT
     * @see GXLength.Unit
     * @class GXLength
     * @constructor
     */
    function GXLength(value, unit) {
        this._value = value;
        this._unit = unit ? unit : GXLength.Unit.PT;
    };

    /**
     * The unit of a length
     * @version 1.0
     */
    GXLength.Unit = {
        /**
         * Point Unit ('pt')
         * @unit Number
         * @version 1.0
         */
        PT: 0,

        /**
         * Pixel Unit ('px')
         * @unit Number
         * @version 1.0
         */
        PX: 1,

        /**
         * Pica Unit ('pc')
         * @unit Number
         * @version 1.0
         */
        PC: 2,

        /**
         * Inch Unit ('in')
         * @unit Number
         * @version 1.0
         */
        IN: 3,

        /**
         * Milimeter Unit ('mm')
         * @unit Number
         * @version 1.0
         */
        MM: 4,

        /**
         * Centimeter Unit ('cm')
         * @unit Number
         * @version 1.0
         */
        CM: 5
    };

    /**
     * Parse and construct a unit from a string. If string is not parseable,
     * this returns null. If string contains a number but invalid unit-unit or
     * none, then the unit-unit of the result defaults to defaultUnit
     * @param {String} string the string to parse for value and unit-unit
     * @param {GXLength.Unit} [defaultUnit] the default unit to be used,
     * defaults to GXLength.Unit.PT
     */
    GXLength.parseLength = function (string, defaultUnit) {
        if (!string) {
            return null;
        }
        string = string.trim();
        if (string.length == 0) {
            return null;
        }

        var number = parseFloat(string.replace(',', '.'));
        if (typeof number != "number") {
            return null;
        }

        var unitType = defaultUnit ? defaultUnit : GXLength.Unit.PT;
        var unitStr = string.substr(number.toString().length);
        if (unitStr && unitStr.length > 0) {
            unitStr = unitStr.trim().toLowerCase();
            if (unitStr.length >= 2 && unitStr.charAt(0) == 'p' && unitStr.charAt(1) == 't') {
                unitType = GXLength.Unit.PT;
            } else if (unitStr.length >= 2 && unitStr.charAt(0) == 'p' && unitStr.charAt(1) == 'x') {
                unitType = GXLength.Unit.PX;
            } else if (unitStr.length >= 2 && unitStr.charAt(0) == 'p' && unitStr.charAt(1) == 'c') {
                unitType = GXLength.Unit.PC;
            } else if (unitStr.length >= 2 && unitStr.charAt(0) == 'i' && unitStr.charAt(1) == 'n') {
                unitType = GXLength.Unit.IN;
            } else if (unitStr.length >= 2 && unitStr.charAt(0) == 'm' && unitStr.charAt(1) == 'm') {
                unitType = GXLength.Unit.MM;
            } else if (unitStr.length >= 2 && unitStr.charAt(0) == 'c' && unitStr.charAt(1) == 'm') {
                unitType = GXLength.Unit.CM;
            } else if (unitStr.length >= 1 && unitStr.charAt(0) == 'm') {
                unitType = GXLength.Unit.M;
            }
        }

        return new GXLength(number, unitType);
    };

    /**
     * Parses an equation (supports /, *, + and -) with optional unit
     * identifiers and evaluates the equation by converting to points
     * @param {String} string the source equation to parse
     * @param {GXLength.Unit} [unit] the unit to be used,
     * defaults to GXLength.Unit.PT
     * @returns {GXLength} null if equation is invalid or a valid length
     * in the given unit space
     */
    GXLength.parseEquation = function (string, unit) {
        unit = unit || GXLength.Unit.PT;
        var context = new LengthHelpers.Context(unit);
        var evaluator = new LengthHelpers.Evaluator(context);
        try {
            result = evaluator.evaluate(string);
            return new GXLength(result, unit);
        } catch (e) {
            return null;
        }
    };

    // Use strict 72ppi for screen
    var dpi = 72.0;

    // Calculate our dpi-map
    var DPI_MAP = [
        1.0, /* PT */
        1.0, /* PX */
        dpi / 6.0, /* PC */
        dpi, /* IN */
        dpi / 25.4, /* MM */
        dpi / 2.54 /* CM */
    ];

    // -----------------------------------------------------------------------------------------------------------------
    // GXLength Class
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @unit {Number}
     * @private
     */
    GXLength.prototype._value = null;

    /**
     * @unit {Number}
     * @see GXLength.Unit
     * @private
     */
    GXLength.prototype._unit = GXLength.Unit.PT;

    GXLength.prototype.toPoint = function () {
        if (this._unit != GXLength.Unit.PT) {
            return DPI_MAP[this._unit] * this._value;
        } else {
            return this._value;
        }
    };

    GXLength.prototype.toUnit = function (unit) {
        if (this._unit != unit) {
            var ptValue = this.toPoint();
            return ptValue / DPI_MAP[unit];
        } else {
            return this._value;
        }
    };

    GXLength.prototype.convert = function (unit) {
        if (this._unit != unit) {
            var ptValue = this.toPoint();
            return new GXLength(ptValue / DPI_MAP[unit], unit);
        } else {
            return new GXLength(this._value, unit);
        }
    };

    GXLength.prototype.toString = function (digits) {
        var result = digits ? this._value.toFixed(digits) : this._value.toString();

        // TODO : Check for locale for correct decimal separator (result.replace('.', '....'))

        switch (this._unit) {
            case GXLength.Unit.PT:
                result += "pt";
                break;
            case GXLength.Unit.PX:
                result += "px";
                break;
            case GXLength.Unit.PC:
                result += "pc";
                break;
            case GXLength.Unit.IN:
                result += "in";
                break;
            case GXLength.Unit.MM:
                result += "mm";
                break;
            case GXLength.Unit.CM:
                result += "cm";
                break;
        }

        return result;
    };

    var LengthHelpers = {};

    LengthHelpers.Token = {
        Operator: 'Operator',
        Identifier: 'Identifier',
        Number: 'Number'
    };

    LengthHelpers.Lexer = function () {
        var expression = '',
            length = 0,
            index = 0,
            marker = 0,
            T = LengthHelpers.Token;

        function peekNextChar() {
            var idx = index;
            return ((idx < length) ? expression.charAt(idx) : '\x00');
        }

        function getNextChar() {
            var ch = '\x00',
                idx = index;
            if (idx < length) {
                ch = expression.charAt(idx);
                index += 1;
            }
            return ch;
        }

        function isWhiteSpace(ch) {
            return (ch === '\u0009') || (ch === ' ') || (ch === '\u00A0');
        }

        function isLetter(ch) {
            return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
        }

        function isDecimalDigit(ch) {
            return (ch >= '0') && (ch <= '9');
        }

        function createToken(unit, value) {
            return {
                unit: unit,
                value: value,
                start: marker,
                end: index - 1
            };
        }

        function skipSpaces() {
            var ch;

            while (index < length) {
                ch = peekNextChar();
                if (!isWhiteSpace(ch)) {
                    break;
                }
                getNextChar();
            }
        }

        function scanOperator() {
            var ch = peekNextChar();
            if ('+-*/()^%=;,'.indexOf(ch) >= 0) {
                return createToken(T.Operator, getNextChar());
            }
            return undefined;
        }

        function isIdentifierStart(ch) {
            return (ch === '_') || isLetter(ch);
        }

        function isIdentifierPart(ch) {
            return isIdentifierStart(ch) || isDecimalDigit(ch);
        }

        function scanIdentifier() {
            var ch, id;

            ch = peekNextChar();
            if (!isIdentifierStart(ch)) {
                return undefined;
            }

            id = getNextChar();
            while (true) {
                ch = peekNextChar();
                if (!isIdentifierPart(ch)) {
                    break;
                }
                id += getNextChar();
            }

            return createToken(T.Identifier, id);
        }

        function scanNumber() {
            var ch, number;

            ch = peekNextChar();
            if (!isDecimalDigit(ch) && (ch !== '.')) {
                return undefined;
            }

            number = '';
            if (ch !== '.') {
                number = getNextChar();
                while (true) {
                    ch = peekNextChar();
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += getNextChar();
                }
            }

            if (ch === '.') {
                number += getNextChar();
                while (true) {
                    ch = peekNextChar();
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += getNextChar();
                }
            }

            if (ch === 'e' || ch === 'E') {
                number += getNextChar();
                ch = peekNextChar();
                if (ch === '+' || ch === '-' || isDecimalDigit(ch)) {
                    number += getNextChar();
                    while (true) {
                        ch = peekNextChar();
                        if (!isDecimalDigit(ch)) {
                            break;
                        }
                        number += getNextChar();
                    }
                } else {
                    ch = 'character ' + ch;
                    if (index >= length) {
                        ch = '<end>';
                    }
                    throw new SyntaxError('Unexpected ' + ch + ' after the exponent sign');
                }
            }

            if (isLetter(ch)) {
                number += getNextChar();
                while (true) {
                    ch = peekNextChar();
                    if (!isLetter(ch)) {
                        break;
                    }
                    number += getNextChar();
                }
            }

            if (number === '.') {
                throw new SyntaxError('Expecting decimal digits after the dot sign');
            }

            return createToken(T.Number, number);
        }

        function reset(str) {
            expression = str;
            length = str.length;
            index = 0;
        }

        function next() {
            var token;

            skipSpaces();
            if (index >= length) {
                return undefined;
            }

            marker = index;

            token = scanNumber();
            if (typeof token !== 'undefined') {
                return token;
            }

            token = scanOperator();
            if (typeof token !== 'undefined') {
                return token;
            }

            token = scanIdentifier();
            if (typeof token !== 'undefined') {
                return token;
            }


            throw new SyntaxError('Unknown token from character ' + peekNextChar());
        }

        function peek() {
            var token, idx;

            idx = index;
            try {
                token = next();
                delete token.start;
                delete token.end;
            } catch (e) {
                token = undefined;
            }
            index = idx;

            return token;
        }

        return {
            reset: reset,
            next: next,
            peek: peek
        };
    };

    LengthHelpers.Parser = function () {

        var lexer = new LengthHelpers.Lexer(),
            T = LengthHelpers.Token;

        function matchOp(token, op) {
            return (typeof token !== 'undefined') &&
                token.unit === T.Operator &&
                token.value === op;
        }

        // ArgumentList := Expression |
        //                 Expression ',' ArgumentList
        function parseArgumentList() {
            var token, expr, args = [];

            while (true) {
                expr = parseExpression();
                if (typeof expr === 'undefined') {
                    // TODO maybe throw exception?
                    break;
                }
                args.push(expr);
                token = lexer.peek();
                if (!matchOp(token, ',')) {
                    break;
                }
                lexer.next();
            }

            return args;
        }

        // FunctionCall ::= Identifier '(' ')' ||
        //                  Identifier '(' ArgumentList ')'
        function parseFunctionCall(name) {
            var token, args = [];

            token = lexer.next();
            if (!matchOp(token, '(')) {
                throw new SyntaxError('Expecting ( in a function call "' + name + '"');
            }

            token = lexer.peek();
            if (!matchOp(token, ')')) {
                args = parseArgumentList();
            }

            token = lexer.next();
            if (!matchOp(token, ')')) {
                throw new SyntaxError('Expecting ) in a function call "' + name + '"');
            }

            return {
                'FunctionCall': {
                    'name': name,
                    'args': args
                }
            };
        }

        // Primary ::= Identifier |
        //             Number |
        //             '(' Assignment ')' |
        //             FunctionCall
        function parsePrimary() {
            var token, expr;

            token = lexer.peek();

            if (typeof token === 'undefined') {
                throw new SyntaxError('Unexpected termination of expression');
            }

            if (token.unit === T.Identifier) {
                token = lexer.next();
                if (matchOp(lexer.peek(), '(')) {
                    return parseFunctionCall(token.value);
                } else {
                    return {
                        'Identifier': token.value
                    };
                }
            }

            if (token.unit === T.Number) {
                token = lexer.next();
                return {
                    'Number': token.value
                };
            }

            if (matchOp(token, '(')) {
                lexer.next();
                expr = parseAssignment();
                token = lexer.next();
                if (!matchOp(token, ')')) {
                    throw new SyntaxError('Expecting )');
                }
                return {
                    'Expression': expr
                };
            }

            throw new SyntaxError('Parse error, can not process token ' + token.value);
        }

        // Unary ::= Primary |
        //           '-' Unary
        function parseUnary() {
            var token, expr;

            token = lexer.peek();
            if (matchOp(token, '-') || matchOp(token, '+')) {
                token = lexer.next();
                expr = parseUnary();
                return {
                    'Unary': {
                        operator: token.value,
                        expression: expr
                    }
                };
            }

            return parsePrimary();
        }

        // Multiplicative ::= Unary |
        //                    Multiplicative '*' Unary |
        //                    Multiplicative '/' Unary
        function parseMultiplicative() {
            var expr, token;

            expr = parseUnary();
            token = lexer.peek();
            while (matchOp(token, '*') || matchOp(token, '/')) {
                token = lexer.next();
                expr = {
                    'Binary': {
                        operator: token.value,
                        left: expr,
                        right: parseUnary()
                    }
                };
                token = lexer.peek();
            }
            return expr;
        }

        // Additive ::= Multiplicative |
        //              Additive '+' Multiplicative |
        //              Additive '-' Multiplicative
        function parseAdditive() {
            var expr, token;

            expr = parseMultiplicative();
            token = lexer.peek();
            while (matchOp(token, '+') || matchOp(token, '-')) {
                token = lexer.next();
                expr = {
                    'Binary': {
                        operator: token.value,
                        left: expr,
                        right: parseMultiplicative()
                    }
                };
                token = lexer.peek();
            }
            return expr;
        }

        // Assignment ::= Identifier '=' Assignment |
        //                Additive
        function parseAssignment() {
            var token, expr;

            expr = parseAdditive();

            if (typeof expr !== 'undefined' && expr.Identifier) {
                token = lexer.peek();
                if (matchOp(token, '=')) {
                    lexer.next();
                    return {
                        'Assignment': {
                            name: expr,
                            value: parseAssignment()
                        }
                    };
                }
                return expr;
            }

            return expr;
        }

        // Expression ::= Assignment
        function parseExpression() {
            return parseAssignment();
        }

        function parse(expression) {
            var expr, token;

            lexer.reset(expression);
            expr = parseExpression();

            token = lexer.next();
            if (typeof token !== 'undefined') {
                throw new SyntaxError('Unexpected token ' + token.value);
            }

            return {
                'Expression': expr
            };
        }

        return {
            parse: parse
        };
    };

    LengthHelpers.Context = function (unit) {
        var Constants, Functions;

        Constants = {
            pi: 3.1415926535897932384,
            phi: 1.6180339887498948482
        };

        Functions = {
            abs: Math.abs,
            acos: Math.acos,
            asin: Math.asin,
            atan: Math.atan,
            ceil: Math.ceil,
            cos: Math.cos,
            exp: Math.exp,
            floor: Math.floor,
            ln: Math.ln,
            random: Math.random,
            sin: Math.sin,
            sqrt: Math.sqrt,
            tan: Math.tan
        };

        return {
            Unit: unit,
            Constants: Constants,
            Functions: Functions,
            Variables: {}
        };
    };

    LengthHelpers.Evaluator = function (ctx) {

        var parser = new LengthHelpers.Parser(),
            context = (arguments.length < 1) ? new LengthHelpers.Context(GXLength.Unit.PT) : ctx;

        function exec(node) {
            var left, right, expr, args, i;

            if (node.hasOwnProperty('Expression')) {
                return exec(node.Expression);
            }

            if (node.hasOwnProperty('Number')) {
                var length = GXLength.parseLength(node.Number, ctx.Unit);
                if (!length) {
                    throw new SyntaxError('Invalid length ' + node.Number);
                }
                return length.toUnit(ctx.Unit);
            }

            if (node.hasOwnProperty('Binary')) {
                node = node.Binary;
                left = exec(node.left);
                right = exec(node.right);
                switch (node.operator) {
                    case '+':
                        return left + right;
                    case '-':
                        return left - right;
                    case '*':
                        return left * right;
                    case '/':
                        return left / right;
                    default:
                        throw new SyntaxError('Unknown operator ' + node.operator);
                }
            }

            if (node.hasOwnProperty('Unary')) {
                node = node.Unary;
                expr = exec(node.expression);
                switch (node.operator) {
                    case '+':
                        return expr;
                    case '-':
                        return -expr;
                    default:
                        throw new SyntaxError('Unknown operator ' + node.operator);
                }
            }

            if (node.hasOwnProperty('Identifier')) {
                if (context.Constants.hasOwnProperty(node.Identifier)) {
                    return context.Constants[node.Identifier];
                }
                if (context.Variables.hasOwnProperty(node.Identifier)) {
                    return context.Variables[node.Identifier];
                }
                throw new SyntaxError('Unknown identifier');
            }

            if (node.hasOwnProperty('Assignment')) {
                right = exec(node.Assignment.value);
                context.Variables[node.Assignment.name.Identifier] = right;
                return right;
            }

            if (node.hasOwnProperty('FunctionCall')) {
                expr = node.FunctionCall;
                if (context.Functions.hasOwnProperty(expr.name)) {
                    args = [];
                    for (i = 0; i < expr.args.length; i += 1) {
                        args.push(exec(expr.args[i]));
                    }
                    return context.Functions[expr.name].apply(null, args);
                }
                throw new SyntaxError('Unknown function ' + expr.name);
            }

            throw new SyntaxError('Unknown syntax node');
        }

        function evaluate(expr) {
            var tree = parser.parse(expr);
            return exec(tree);
        }

        return {
            evaluate: evaluate
        };
    };


    _.GXLength = GXLength;
})(this);