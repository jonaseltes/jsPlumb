/*
 * jsPlumb
 * 
 * Title:jsPlumb 1.6.1
 * 
 * Provides a way to visually connect elements on an HTML page, using SVG or VML.  
 * 
 * This file contains the utility functions.
 *
 * Copyright (c) 2010 - 2014 Simon Porritt (simon@jsplumbtoolkit.com)
 * 
 * http://jsplumbtoolkit.com
 * http://github.com/sporritt/jsplumb
 * 
 * Dual licensed under the MIT and GPL2 licenses.
 */
;(function() {


    var _isa = function(a) { return Object.prototype.toString.call(a) === "[object Array]"; },
        _isnum = function(n) { return Object.prototype.toString.call(n) === "[object Number]"; },
        _iss = function(s) { return typeof s === "string"; },
        _isb = function(s) { return typeof s === "boolean"; },
        _isnull = function(s) { return s == null; },  
        _iso = function(o) { return o == null ? false : Object.prototype.toString.call(o) === "[object Object]"; },
        _isd = function(o) { return Object.prototype.toString.call(o) === "[object Date]"; },
        _isf = function(o) { return Object.prototype.toString.call(o) === "[object Function]"; },
        _ise = function(o) {
            for (var i in o) { if (o.hasOwnProperty(i)) return false; }
            return true;
        },
        pointHelper = function(p1, p2, fn) {
            p1 = _isa(p1) ? p1 : [p1.x, p1.y];
            p2 = _isa(p2) ? p2 : [p2.x, p2.y];    
            return fn(p1, p2);
        };
    
    jsPlumbUtil = {        
        isArray : _isa,        
        isString : _iss,        
        isBoolean: _isb,        
        isNull : _isnull,        
        isObject : _iso,
        isDate : _isd,
        isFunction: _isf,
        isEmpty:_ise,
        isNumber:_isnum,
        clone : function(a) {
            if (_iss(a)) return "" + a;
            else if (_isb(a)) return !!a;
            else if (_isd(a)) return new Date(a.getTime());
            else if (_isf(a)) return a;
            else if (_isa(a)) {
                var b = [];
                for (var i = 0; i < a.length; i++)
                    b.push(this.clone(a[i]));
                return b;
            }
            else if (_iso(a)) {
                var c = {};
                for (var j in a)
                    c[j] = this.clone(a[j]);
                return c;
            }
            else return a;
        },
        matchesSelector : function(el, selector, ctx) {
            ctx = ctx || el.parentNode;
            var possibles = ctx.querySelectorAll(selector);
            for (var i = 0; i < possibles.length; i++) {
                if (possibles[i] === el)
                    return true;
            }
            return false;
        },
        merge : function(a, b) {
            var c = this.clone(a);
            for (var i in b) {
                if (c[i] == null || _iss(b[i]) || _isb(b[i]))
                    c[i] = b[i];
                else {
                    if (_isa(b[i])) {
                        var ar = [];
                        // if c's object is also an array we can keep its values.
                        if (_isa(c[i])) ar.push.apply(ar, c[i]);
                        ar.push.apply(ar, b[i]);
                        c[i] = ar;
                    }
                    else if(_iso(b[i])) {
                        // overwite c's value with an object if it is not already one.
                        if (!_iso(c[i])) 
                            c[i] = {};
                        for (var j in b[i])
                            c[i][j] = b[i][j];
                    }
                }
            }
            return c;
        },
        //
        // chain a list of functions, supplied by [ object, method name, args ], and return on the first
        // one that returns the failValue. if none return the failValue, return the successValue.
        //
        functionChain : function(successValue, failValue, fns) {
            for (var i = 0; i < fns.length; i++) {
                var o = fns[i][0][fns[i][1]].apply(fns[i][0], fns[i][2]);
                if (o === failValue) {
                    return o;
                }
            }
            return successValue;
        },
        // take the given model and expand out any parameters.
        populate : function(model, values) {
            // for a string, see if it has parameter matches, and if so, try to make the substitutions.
            var getValue = function(fromString) {
                    var matches = fromString.match(/(\${.*?})/g);
                    if (matches != null) {
                        for (var i = 0; i < matches.length; i++) {
                            var val = values[matches[i].substring(2, matches[i].length - 1)];
                            if (val != null) {
                                fromString = fromString.replace(matches[i], val);
                            }
                        }
                    }
                    return fromString;
                },		
                // process one entry.
                _one = function(d) {
                    if (d != null) {
                        if (_iss(d)) {
                            return getValue(d);
                        }
                        else if (_isa(d)) {
                            var r = [];	
                            for (var i = 0; i < d.length; i++)
                                r.push(_one(d[i]));
                            return r;
                        }
                        else if (_iso(d)) {
                            var s = {};
                            for (var j in d) {
                                s[j] = _one(d[j]);
                            }
                            return s;
                        }
                        else {
                            return d;
                        }
                    }
                };
            
            return _one(model);	
        },
        convertStyle : function(s, ignoreAlpha) {
            // TODO: jsPlumb should support a separate 'opacity' style member.
            if ("transparent" === s) return s;
            var o = s,
                pad = function(n) { return n.length == 1 ? "0" + n : n; },
                hex = function(k) { return pad(Number(k).toString(16)); },
                pattern = /(rgb[a]?\()(.*)(\))/;
            if (s.match(pattern)) {
                var parts = s.match(pattern)[2].split(",");
                o = "#" + hex(parts[0]) + hex(parts[1]) + hex(parts[2]);
                if (!ignoreAlpha && parts.length == 4) 
                    o = o + hex(parts[3]);
            }
            return o;
        },
        findWithFunction : function(a, f) {
            if (a)
                for (var i = 0; i < a.length; i++) if (f(a[i])) return i;
            return -1;
		},
		indexOf : function(l, v) {
			return l.indexOf ? l.indexOf(v) : jsPlumbUtil.findWithFunction(l, function(_v) { return _v == v; });
		},
		removeWithFunction : function(a, f) {
			var idx = jsPlumbUtil.findWithFunction(a, f);
			if (idx > -1) a.splice(idx, 1);
			return idx != -1;
		},
		remove : function(l, v) {
			var idx = jsPlumbUtil.indexOf(l, v);
			if (idx > -1) l.splice(idx, 1);
			return idx != -1;
		},
        // TODO support insert index
        addWithFunction : function(list, item, hashFunction) {
            if (jsPlumbUtil.findWithFunction(list, hashFunction) == -1) list.push(item);
        },
        addToList : function(map, key, value, insertAtStart) {
            var l = map[key];
            if (l == null) {
                l = []; 
				map[key] = l;
            }
            l[insertAtStart ? "unshift" : "push"](value);
            return l;
        },
        consume : function(e, doNotPreventDefault) {
            if (e.stopPropagation)
                e.stopPropagation();
            else 
                e.returnValue = false;
            
            if (!doNotPreventDefault && e.preventDefault)
                 e.preventDefault();
        },
        //
        // extends the given obj (which can be an array) with the given constructor function, prototype functions, and
        // class members, any of which may be null.
        //
        extend : function(child, parent, _protoFn) {
			var i;
            parent = _isa(parent) ? parent : [ parent ];

            for (i = 0; i < parent.length; i++) {
                for (var j in parent[i].prototype) {
                    if(parent[i].prototype.hasOwnProperty(j)) {
                        child.prototype[j] = parent[i].prototype[j];
                    }
                }
            }

            var _makeFn = function(name, protoFn) {
                return function() {
                    for (i = 0; i < parent.length; i++) {
                        if (parent[i].prototype[name])
                            parent[i].prototype[name].apply(this, arguments);
                    }                    
                    return protoFn.apply(this, arguments);
                };
            };
			
			var _oneSet = function(fns) {
				for (var k in fns) {
					child.prototype[k] = _makeFn(k, fns[k]);
				}
			};

			if (arguments.length > 2) {
				for (i = 2; i < arguments.length; i++)
					_oneSet(arguments[i]);
			}

            return child;
        },
        uuid : function() {
            return ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            }));
        },
        logEnabled : true,
        log : function() {
            if (jsPlumbUtil.logEnabled && typeof console != "undefined") {
                try {
                    var msg = arguments[arguments.length - 1];
                    console.log(msg);
                }
                catch (e) {} 
            }
        },
        /*
         * Function: sizeElement 
         * Helper to size and position an element. You would typically use
         * this when writing your own Connector or Endpoint implementation.
         * 
         * Parameters: 
         *  x - [int] x position for the element origin 
         *  y - [int] y position for the element origin 
         *  w - [int] width of the element 
         *  h - [int] height of the element
         *  
         */
        sizeElement : function(el, x, y, w, h) {
            if (el) {
                el.style.height = h + "px";
                el.height = h;
                el.style.width = w + "px";
                el.width = w;
                el.style.left = x + "px";
                el.style.top = y + "px";
            }
        },
        /**
        * @name jsPlumbUtil.wrap
        * @desc Wraps one function with another, creating a placeholder for the
        * wrapped function if it was null. this is used to wrap the various
        * drag/drop event functions - to allow jsPlumb to be notified of
        * important lifecycle events without imposing itself on the user's
        * drag/drop functionality. 
        * @param {Function} wrappedFunction original function to wrap; may be null.
        * @param {Function} newFunction function to wrap the original with.
        * @param {Object} [returnOnThisValue] Optional. Indicates that the wrappedFunction should 
        * not be executed if the newFunction returns a value matching 'returnOnThisValue'.
        * note that this is a simple comparison and only works for primitives right now.
        */        
        wrap : function(wrappedFunction, newFunction, returnOnThisValue) {
            wrappedFunction = wrappedFunction || function() { };
            newFunction = newFunction || function() { };
            return function() {
                var r = null;
                try {
                    r = newFunction.apply(this, arguments);
                } catch (e) {
                    jsPlumbUtil.log("jsPlumb function failed : " + e);
                }
                if (returnOnThisValue == null || (r !== returnOnThisValue)) {
                    try {
                        r = wrappedFunction.apply(this, arguments);
                    } catch (e) {
                        jsPlumbUtil.log("wrapped function failed : " + e);
                    }
                }
                return r;
            };
        },
        ieVersion : /MSIE\s([\d.]+)/.test(navigator.userAgent) ? (new Number(RegExp.$1)) : -1
    };

    jsPlumbUtil.oldIE = jsPlumbUtil.ieVersion > -1 && jsPlumbUtil.ieVersion < 9;

	jsPlumbUtil.EventGenerator = function() {
		var _listeners = {}, 
			eventsSuspended = false,
			// this is a list of events that should re-throw any errors that occur during their dispatch. it is current private.
			eventsToDieOn = { "ready":true };

		this.bind = function(event, listener, insertAtStart) {
			jsPlumbUtil.addToList(_listeners, event, listener, insertAtStart);
			return this;
		};

		this.fire = function(event, value, originalEvent) {
			if (!eventsSuspended && _listeners[event]) {
				var l = _listeners[event].length, i = 0, _gone = false, ret = null;
				if (!this.shouldFireEvent || this.shouldFireEvent(event, value, originalEvent)) {
					while (!_gone && i < l && ret !== false) {
						// doing it this way rather than catching and then possibly re-throwing means that an error propagated by this
						// method will have the whole call stack available in the debugger.
						if (eventsToDieOn[event]) 
							_listeners[event][i].apply(this, [ value, originalEvent]);
						else {
							try {
								ret = _listeners[event][i].apply(this, [ value, originalEvent ]);
							} catch (e) {
								jsPlumbUtil.log("jsPlumb: fire failed for event " + event + " : " + e);
							}
						}
						i++;
						if (_listeners == null || _listeners[event] == null) 
							_gone = true;
					}
				}
			}
			return this;
		};

		this.unbind = function(event) {
			if (event)
				delete _listeners[event];
			else {
				_listeners = {};
			}
			return this;
		};

		this.getListener = function(forEvent) { return _listeners[forEvent]; };
		this.setSuspendEvents = function(val) { eventsSuspended = val; };
		this.isSuspendEvents = function() { return eventsSuspended; };
		this.cleanupListeners = function() {
			for (var i in _listeners) {
				_listeners[i] = null;
			}
		};
	};

	jsPlumbUtil.EventGenerator.prototype = {
		cleanup:function() {
			this.cleanupListeners();
		}
	};

    // thanks MDC
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fbind
    if (!Function.prototype.bind) {
      Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
          // closest thing possible to the ECMAScript 5 internal IsCallable function
          throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1), 
            fToBind = this, 
            fNOP = function () {},
            fBound = function () {
              return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                                   aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
      };
    }

})();