define(function(require, exports, module) {
    var rules = {},
        messages = {},
		$ = require('jquery'),
        handlebars = require('handlebars'),
        async = require('async'),
        Base = require('base');

    var Rule = Base.extend({

        initialize: function(name, operator, async) {
            this.name = name;

            if (async) {
                this.operator = operator;
            } else {
                switch($.type(operator)) {
                    case 'regexp':
                        this.operator =  function(opts, commit) {
                            var result = operator.test($(opts.element).val());
                            commit(result ? null : opts.ruleName, _getMsg(opts, result));
                        };
                        break;
                    case 'function':
                        this.operator = function(opts, commit) {
                            var result = operator(opts);
                            commit(result ? null : opts.ruleName, _getMsg(opts, result));
                        };
                        break;
                    default:
                        throw 'The second argument must be a regexp or a function.';

                }
            }
        },

        and: function(name, options) {
            if (name instanceof Rule) {
                var target = name;
            } else {
                var target = getRule(name, options);
            }

            if (!target) {
                throw 'No rule with name "' + name + '" found.';
            }

            var that = this;
            var operator = function(opts, commit) {
                that.operator(opts, function(err, msg) {
                    if (err) {
                        commit(err, _getMsg(opts, !err));
                    } else {
                        target.operator(opts, commit);
                    }
                });
            }

            return new Rule(null, operator, true);
        },

        or: function(name, options) {
            if (name instanceof Rule) {
                var target = name;
            } else {
                var target = getRule(name, options);
            }

            if (!target) {
                throw 'No rule with name "' + name + '" found.';
            }

            var that = this;
            var operator = function(opts, commit) {
                that.operator(opts, function(err, msg) {
                    if (err) {
                        target.operator(opts, commit);
                    } else {
                        commit(null, _getMsg(opts, true));
                    }
                });
            }

            return new Rule(null, operator, true);
        },

        not: function(options) {
            var target = getRule(this.name, options);
            var operator = function(opts, commit) {
                target.operator(opts, function(err, msg) {
                    if (err) {
                        commit(null, _getMsg(opts, true));
                    } else {
                        commit(true, _getMsg(opts, false))
                    }
                });
            };

            return new Rule(null, operator, true);
        }
    });

    function addRule(name, operator, message) {
        if (rules[name]) {
            throw 'The rule with the same name has existed and overriding a rule is not allowed!';
        }

        rules[name] = new Rule(name, operator);
        addMessage(name, message);
    }

    function addAsyncRule (name, operator) {
        if (rules[name]) {
            throw 'The rule with the same name has existed and overriding a rule is not allowed!';
        }

        rules[name] = new Rule(name, operator, true);
    }

    function addCombinedRule(name, rule) {
        if (rules[name]) {
            throw 'The rule with the same name has existed and overriding a rule is not allowed!';
        }
        
        rule.name = name;
        rules[name] = rule;
    }

    function _getMsg(opts, b) {
        var ruleName = opts.ruleName;

        var msgtpl;
        if (opts.message) { // user specifies a message
            if ($.isPlainObject(opts.message)) {
                msgtpl = opts.message[b ? 'success' : 'failure'];
            } else {//just string
                msgtpl = b ? '' : opts.message
            }
        } else { // use default
            msgtpl = messages[ruleName][b ? 'success' : 'failure'];
        }

        return msgtpl ? handlebars.compile(msgtpl)(opts) : msgtpl;
    }

    //addAndRule('emailOrPhone', ['email', 'phone'])
    function addAndRule(name, combination) {
        if (rules[name]) {
            throw 'The rule with the same name has existed and overriding a rule is not allowed!';
        }

    }

    function addMessage(name, msg) {
        if ($.isPlainObject(msg)) {
            messages[name] = msg;
        } else {
            messages[name] = {
                failure: msg
            };
        }
    }

    function getOperator(name) {
        return rules[name].operator;
    }

    function getRule(name, opts) {
        if (opts) {
            var rule = rules[name];
            return new Rule(null, function(options, commit) {
                rule.operator($.extend(null, options, opts), commit);
            }, true);
        } else {
            return rules[name];
        }
    }

    /*
    var defaultRules = {

        email: /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,

        string: /\d$/,

        integer: /^[1-9][0-9]*$/
    };

    $.each(defaultRules, function(name, rule) {
        addRule(name, rule);
    });
    */

    addRule('required', function(options) {
        var element = $(options.element);
        
        var t = element.attr('type');
        switch (t) {
            case 'checkbox':
            case 'radio':
                var checked = false;
                element.each(function(i, item) {
                    if ($(item).prop('checked')) {
                        checked = true;
                        return false;
                    }
                });
                return checked;
            default:
                return Boolean(element.val());
        }
    }, '{{display}}不能为空');

    addRule('email', /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/, '{{display}}的格式不正确');

    addRule('text', /.*/);

    addRule('password', /.*/);

    addRule('radio', /.*/);

    addRule('checkbox', /.*/);

    addRule('url', /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/, '{{display}}的格式不正确');

    addRule('number', function(options) {
        var element = $(options.element);
            val = element.val(),
            min = options.min,
            max = options.max;

        var b = /^[+-]?[1-9][0-9]*(\.[0-9]+)?([eE][+-][1-9][0-9]*)?$|^[+-]?0?\.[0-9]+([eE][+-][1-9][0-9]*)?$/.test(val);
        if (min) {
            b = (b && b >= min);
        }
        if (options.max) {
            b = (b && b <= max);
        }
        return b;
    }, '请输入正确的{{display}}');

    addRule('date', /^\d{4}\-[01]?\d\-[0-3]?\d$|^[01]\d\/[0-3]\d\/\d{4}$|^\d{4}年[01]?\d月[0-3]?\d[日号]$/, '{{display}}的格式不正确');

    //options.mix and options.max must be specified
    addRule('lengthBetween', function(options) {
        var element = $(options.element);
        var l = element.val().length;
        return l >= options.min && l <= options.max;
    }, '{{display}}长度必须在{{min}}和{{max}}之间');

    addRule('mobile', /^1[3458]\d{9}$/, '请输入正确的{{display}}');

    addRule('maxLength', function(options) {
        var element = $(options.element);
        var l = element.val().length;
        return l <= options.max;
    }, '{{display}}的长度不能超过{{max}}');

    addRule('minLength', function(options) {
        var element = $(options.element);
        var l = element.val().length;
        return l >= options.min;
    }, '{{display}}的长度不能超过{{min}}');

    addRule('confirmation', function(options) {
        var element = $(options.element),
            target = $('#' + options.id);
        return element.val() == target.val();
    }, '{{display}}的值和{{name}}不一样');

    module.exports = {
        addRule: addRule,
        addAsyncRule: addAsyncRule,
        addCombinedRule: addCombinedRule,
        addMessage: addMessage,
        getRule: getRule,
        getOperator: getOperator
    };

});
