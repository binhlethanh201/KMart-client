(() => {
var __webpack_modules__ = ({
449(__unused_rspack_module, exports) {
exports.s = function() {
    return {
        t: function t(k, v) {
            if (v && v.v0 !== undefined) return String(k).replace(/\{v0\}/g, v.v0);
            return k;
        }
    };
};


},
98(__unused_rspack_module, exports) {
"use strict";
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
function jsxProd(type, config, maybeKey) {
    var key = null;
    void 0 !== maybeKey && (key = "" + maybeKey);
    void 0 !== config.key && (key = "" + config.key);
    if ("key" in config) {
        maybeKey = {};
        for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
    } else maybeKey = config;
    config = maybeKey.ref;
    return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: type,
        key: key,
        ref: void 0 !== config ? config : null,
        props: maybeKey
    };
}
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.jsx = jsxProd;
exports.jsxs = jsxProd;


},
712(module, __unused_rspack_exports, __webpack_require__) {
"use strict";

if (true) {
    module.exports = __webpack_require__(98);
} else {}


},

});
// The module cache
var __webpack_module_cache__ = {};

// The require function
function __webpack_require__(moduleId) {

// Check if module is in cache
var cachedModule = __webpack_module_cache__[moduleId];
if (cachedModule !== undefined) {
return cachedModule.exports;
}
// Create a new module (and put it into the cache)
var module = (__webpack_module_cache__[moduleId] = {
exports: {}
});
// Execute the module function
__webpack_modules__[moduleId](module, module.exports, __webpack_require__);

// Return the exports of the module
return module.exports;

}

// webpack/runtime/define_property_getters
(() => {
__webpack_require__.d = (exports, getters, values) => {
	var define = (defs, kind) => {
		for(var key in defs) {
			if(__webpack_require__.o(defs, key) && !__webpack_require__.o(exports, key)) {
				Object.defineProperty(exports, key, { enumerable: true, [kind]: defs[key] });
			}
		}
	};
	define(getters, "get");
	define(values, "value");
};
})();
// webpack/runtime/has_own_property
(() => {
__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
})();
// webpack/runtime/make_namespace_object
(() => {
// define __esModule on exports
__webpack_require__.r = (exports) => {
	if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	}
	Object.defineProperty(exports, '__esModule', { value: true });
};
})();
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ TrendLineChart)
});

// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(712);
;// CONCATENATED MODULE: external "react"
const external_react_namespaceObject = require("react");
// EXTERNAL MODULE: ./.chart-test-g4f2Jg/i18n-stub.js
var i18n_stub = __webpack_require__(449);
;// CONCATENATED MODULE: ./src/features/reports/components/TrendLineChart.jsx
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) {
        return Array.from(iter);
    }
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function TrendLineChart_ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    else {
        TrendLineChart_ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}



var PAD = {
    top: 20,
    right: 20,
    bottom: 38,
    left: 52
};
var TOOLTIP_W = 210;
/** Bề rộng tạm dùng ở lần render đầu (trước khi đo được khung thật). */ var FALLBACK_WIDTH = 900;
/**
 * Mốc trục Y "đẹp" (1/2/5 × 10^n) để tránh nhãn lẻ như 0,3,6,8,11.
 */ function niceScale(maxValue) {
    var tickCount = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 4;
    var max = Math.max(maxValue, 1);
    var raw = max / tickCount;
    var magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    var normalized = raw / magnitude;
    var niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
    // Số liệu là SỐ ĐƠN (nguyên) nên bước chia luôn tối thiểu 1 để nhãn không bị lẻ như 0,5.
    var step = Math.max(1, Math.round(niceStep));
    var top = Math.ceil(max / step) * step;
    var ticks = [];
    for(var v = 0; v <= top + step / 1000; v += step)ticks.push(Math.round(v * 1000) / 1000);
    return {
        top: top,
        ticks: ticks
    };
}
/**
 * BE-51: biểu đồ ĐƯỜNG nhiều chuỗi cho xu hướng đơn theo tháng.
 *
 * BE-55: vẽ theo TOẠ ĐỘ PIXEL THẬT (đo bằng ResizeObserver) thay cho viewBox 0..100 co giãn,
 * nên các điểm tròn không còn bị méo thành hình ellipse; trục Y chia mốc đẹp; có vùng tô dần
 * dưới đường và hộp thông tin không tràn ra ngoài khung.
 *
 * series: [{ key, label, color, values: number[] }]
 * labels: string[] (nhãn trục X, ví dụ "T10/2026")
 * changePercents: number[] — % tăng/giảm so với tháng trước (hiện dưới nhãn và trong hộp thông tin)
 * tooltips: object[] — dòng thông tin BỔ SUNG cho từng tháng trong hộp thông tin
 */ function TrendLineChart(param) {
    var _param_labels = param.labels, labels = _param_labels === void 0 ? [] : _param_labels, _param_series = param.series, series = _param_series === void 0 ? [] : _param_series, _param_changePercents = param.changePercents, changePercents = _param_changePercents === void 0 ? null : _param_changePercents, _param_tooltips = param.tooltips, tooltips = _param_tooltips === void 0 ? null : _param_tooltips, _param_height = param.height, height = _param_height === void 0 ? 280 : _param_height;
    var _Math;
    var _ref;
    var _paths_, _paths_1, _paths__values, _paths_2;
    var t = (0,i18n_stub/* .useI18n */.s)().t;
    // BE-55: chỉ đo CHIỀU RỘNG; chiều cao lấy trực tiếp từ prop. Trước đây chờ đo được cả 2
    // chiều mới vẽ, mà phép đo có thể trả về 0 -> biểu đồ trắng trơn dù có dữ liệu.
    //
    // BE-56: dùng ref dạng callback + theo dõi phần tử trong state. Lỗi trước đây: khi màn báo cáo
    // còn đang tải dữ liệu thì `labels` rỗng nên component return sớm, khung chưa được gắn vào DOM
    // -> effect (deps rỗng) chạy đúng 1 lần khi khung chưa tồn tại rồi KHÔNG BAO GIỜ chạy lại,
    // nên bề rộng mãi bằng 0 và biểu đồ chỉ vẽ được đúng bằng bề rộng dự phòng 900px (hụt nửa khung).
    var _useState = _sliced_to_array((0,external_react_namespaceObject.useState)(null), 2), wrapEl = _useState[0], setWrapEl = _useState[1];
    var _useState1 = _sliced_to_array((0,external_react_namespaceObject.useState)(0), 2), measuredWidth = _useState1[0], setMeasuredWidth = _useState1[1];
    var _useState2 = _sliced_to_array((0,external_react_namespaceObject.useState)(null), 2), hoverIdx = _useState2[0], setHoverIdx = _useState2[1];
    var gradientId = (0,external_react_namespaceObject.useId)();
    (0,external_react_namespaceObject.useEffect)(function() {
        if (!wrapEl) return undefined;
        var measure = function measure() {
            var w = Math.round(wrapEl.getBoundingClientRect().width);
            if (w > 0) setMeasuredWidth(function(prev) {
                return prev === w ? prev : w;
            });
        };
        measure();
        // Đo lại sau khung hình đầu để bắt được trường hợp lúc mount khung chưa có kích thước.
        var raf = typeof requestAnimationFrame === 'undefined' ? null : requestAnimationFrame(measure);
        window.addEventListener('resize', measure);
        if (typeof ResizeObserver === 'undefined') {
            return function() {
                if (raf !== null) cancelAnimationFrame(raf);
                window.removeEventListener('resize', measure);
            };
        }
        var observer = new ResizeObserver(measure);
        observer.observe(wrapEl);
        return function() {
            if (raf !== null) cancelAnimationFrame(raf);
            window.removeEventListener('resize', measure);
            observer.disconnect();
        };
    }, [
        wrapEl
    ]);
    var _useMemo = (0,external_react_namespaceObject.useMemo)(function() {
        return niceScale((_Math = Math).max.apply(_Math, _to_consumable_array(series.flatMap(function(s) {
            return s.values || [];
        })).concat([
            0
        ])));
    }, [
        series
    ]), top = _useMemo.top, ticks = _useMemo.ticks;
    // Luôn vẽ được: nếu chưa đo được bề rộng thì dùng tạm giá trị hợp lý thay vì để trắng.
    var chartWidth = measuredWidth > 0 ? measuredWidth : FALLBACK_WIDTH;
    var chartHeight = height;
    var innerW = Math.max(1, chartWidth - PAD.left - PAD.right);
    var innerH = Math.max(1, chartHeight - PAD.top - PAD.bottom);
    var stepX = labels.length > 1 ? innerW / (labels.length - 1) : 0;
    var toX = function toX(i) {
        return PAD.left + i * stepX;
    };
    var toY = function toY(v) {
        return PAD.top + innerH - v / (top || 1) * innerH;
    };
    var paths = (0,external_react_namespaceObject.useMemo)(function() {
        return series.map(function(s) {
            var pts = (s.values || []).map(function(v, i) {
                return {
                    x: toX(i),
                    y: toY(v),
                    value: v
                };
            });
            var line = pts.map(function(p, i) {
                return "".concat(i === 0 ? 'M' : 'L').concat(p.x.toFixed(2), ",").concat(p.y.toFixed(2));
            }).join(' ');
            var base = (PAD.top + innerH).toFixed(2);
            var area = pts.length > 1 ? "".concat(line, " L").concat(pts[pts.length - 1].x.toFixed(2), ",").concat(base, " L").concat(pts[0].x.toFixed(2), ",").concat(base, " Z") : '';
            return _object_spread_props(_object_spread({}, s), {
                points: pts,
                line: line,
                area: area
            });
        });
    }, // toạ độ phụ thuộc kích thước khung nên phải tính lại khi khung đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        series,
        innerW,
        innerH,
        top,
        labels.length
    ]);
    if (!labels.length) {
        return /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
            className: "py-10 text-center text-sm text-gray-500",
            children: t('Không có dữ liệu xu hướng')
        });
    }
    var hoverX = hoverIdx !== null ? toX(hoverIdx) : null;
    var extra = tooltips && hoverIdx !== null ? tooltips[hoverIdx] : null;
    // Hộp thông tin: chỉ liệt kê chuỗi có số > 0 (bớt rối khi nhiều loại đơn cùng bằng 0)
    var tooltipRows = hoverIdx === null ? [] : paths.map(function(s) {
        var _ref;
        var _s_values;
        return {
            key: s.key,
            label: s.label,
            color: s.color,
            value: (_ref = (_s_values = s.values) === null || _s_values === void 0 ? void 0 : _s_values[hoverIdx]) !== null && _ref !== void 0 ? _ref : 0
        };
    }).filter(function(r) {
        return r.value > 0;
    }).sort(function(a, b) {
        return b.value - a.value;
    });
    var tooltipLeft = hoverIdx === null ? 0 : Math.min(Math.max(8, toX(hoverIdx) + (hoverIdx > labels.length / 2 ? -TOOLTIP_W - 14 : 14)), Math.max(8, chartWidth - TOOLTIP_W - 8));
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                className: "flex flex-wrap items-center gap-x-5 gap-y-2 mb-3",
                children: [
                    paths.map(function(s) {
                        return /*#__PURE__*/ (0,jsx_runtime.jsxs)("span", {
                            className: "inline-flex items-center gap-1.5",
                            children: [
                                /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                                    className: "w-2.5 h-2.5 rounded-full",
                                    style: {
                                        backgroundColor: s.color
                                    }
                                }),
                                /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                                    className: "text-[11px] font-semibold uppercase tracking-wide text-gray-500",
                                    children: s.label
                                })
                            ]
                        }, s.key);
                    }),
                    /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                        className: "text-[10px] text-gray-400 ml-auto",
                        children: t('Đưa chuột vào biểu đồ để xem chi tiết tháng')
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                ref: setWrapEl,
                className: "relative w-full",
                style: {
                    height: height
                },
                children: [
                    /*#__PURE__*/ (0,jsx_runtime.jsxs)("svg", {
                        width: chartWidth,
                        height: chartHeight,
                        className: "block",
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime.jsx)("defs", {
                                children: /*#__PURE__*/ (0,jsx_runtime.jsxs)("linearGradient", {
                                    id: gradientId,
                                    x1: "0",
                                    y1: "0",
                                    x2: "0",
                                    y2: "1",
                                    children: [
                                        /*#__PURE__*/ (0,jsx_runtime.jsx)("stop", {
                                            offset: "0%",
                                            stopColor: ((_paths_ = paths[0]) === null || _paths_ === void 0 ? void 0 : _paths_.color) || '#10b981',
                                            stopOpacity: "0.22"
                                        }),
                                        /*#__PURE__*/ (0,jsx_runtime.jsx)("stop", {
                                            offset: "100%",
                                            stopColor: ((_paths_1 = paths[0]) === null || _paths_1 === void 0 ? void 0 : _paths_1.color) || '#10b981',
                                            stopOpacity: "0.01"
                                        })
                                    ]
                                })
                            }),
                            ticks.map(function(v) {
                                return /*#__PURE__*/ (0,jsx_runtime.jsxs)("g", {
                                    children: [
                                        /*#__PURE__*/ (0,jsx_runtime.jsx)("line", {
                                            x1: PAD.left,
                                            y1: toY(v),
                                            x2: PAD.left + innerW,
                                            y2: toY(v),
                                            stroke: v === 0 ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.06)',
                                            strokeWidth: 1,
                                            shapeRendering: "crispEdges"
                                        }),
                                        /*#__PURE__*/ (0,jsx_runtime.jsx)("text", {
                                            x: PAD.left - 10,
                                            y: toY(v) + 3.5,
                                            textAnchor: "end",
                                            className: "fill-gray-400",
                                            style: {
                                                fontSize: 10,
                                                fontWeight: 600
                                            },
                                            children: v
                                        })
                                    ]
                                }, v);
                            }),
                            paths.length === 1 && paths[0].area && /*#__PURE__*/ (0,jsx_runtime.jsx)("path", {
                                d: paths[0].area,
                                fill: "url(#".concat(gradientId, ")"),
                                stroke: "none"
                            }),
                            hoverX !== null && /*#__PURE__*/ (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime.jsx)("rect", {
                                        x: hoverX - stepX / 2,
                                        y: PAD.top,
                                        width: Math.max(stepX, 1),
                                        height: innerH,
                                        fill: "rgba(217,74,56,0.05)"
                                    }),
                                    /*#__PURE__*/ (0,jsx_runtime.jsx)("line", {
                                        x1: hoverX,
                                        y1: PAD.top,
                                        x2: hoverX,
                                        y2: PAD.top + innerH,
                                        stroke: "rgba(217,74,56,0.45)",
                                        strokeWidth: 1,
                                        strokeDasharray: "3 3"
                                    })
                                ]
                            }),
                            paths.map(function(s) {
                                return /*#__PURE__*/ (0,jsx_runtime.jsx)("path", {
                                    d: s.line,
                                    fill: "none",
                                    stroke: s.color,
                                    strokeWidth: 2,
                                    strokeLinejoin: "round",
                                    strokeLinecap: "round"
                                }, s.key);
                            }),
                            paths.map(function(s) {
                                return s.points.map(function(p, i) {
                                    var isHover = hoverIdx === i;
                                    if (p.value === 0 && !isHover) return null;
                                    return /*#__PURE__*/ (0,jsx_runtime.jsx)("circle", {
                                        cx: p.x,
                                        cy: p.y,
                                        r: isHover ? 5 : 3.5,
                                        fill: isHover ? s.color : '#fff',
                                        stroke: s.color,
                                        strokeWidth: 2
                                    }, "".concat(s.key, "-").concat(i));
                                });
                            }),
                            labels.map(function(lb, i) {
                                return /*#__PURE__*/ (0,jsx_runtime.jsx)("text", {
                                    x: toX(i),
                                    y: PAD.top + innerH + 16,
                                    textAnchor: "middle",
                                    className: hoverIdx === i ? 'fill-[#d94a38]' : 'fill-gray-400',
                                    style: {
                                        fontSize: 10,
                                        fontWeight: 700
                                    },
                                    children: lb
                                }, lb + i);
                            }),
                            changePercents && labels.map(function(lb, i) {
                                if (i === 0 || changePercents[i] === undefined) return null;
                                var v = changePercents[i];
                                var color = v > 0 ? '#059669' : v < 0 ? '#dc2626' : '#9ca3af';
                                return /*#__PURE__*/ (0,jsx_runtime.jsxs)("text", {
                                    x: toX(i),
                                    y: PAD.top + innerH + 30,
                                    textAnchor: "middle",
                                    fill: color,
                                    style: {
                                        fontSize: 9.5,
                                        fontWeight: 700
                                    },
                                    children: [
                                        v > 0 ? '▲' : v < 0 ? '▼' : '•',
                                        " ",
                                        Math.abs(v).toFixed(0),
                                        "%"
                                    ]
                                }, "chg-".concat(lb, "-").concat(i));
                            })
                        ]
                    }),
                    hoverIdx !== null && /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                        className: "absolute z-20 pointer-events-none rounded-xl border border-[#eeece7] bg-white shadow-lg px-3 py-2.5",
                        style: {
                            left: tooltipLeft,
                            top: 6,
                            width: TOOLTIP_W
                        },
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                                className: "text-[12px] font-bold text-[#1d1d1f] mb-2 flex items-center justify-between gap-2",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                                        children: labels[hoverIdx]
                                    }),
                                    /*#__PURE__*/ (0,jsx_runtime.jsxs)("span", {
                                        className: "text-[10px] font-semibold text-gray-400 whitespace-nowrap",
                                        children: [
                                            (_ref = (_paths_2 = paths[0]) === null || _paths_2 === void 0 ? void 0 : (_paths__values = _paths_2.values) === null || _paths__values === void 0 ? void 0 : _paths__values[hoverIdx]) !== null && _ref !== void 0 ? _ref : 0,
                                            " ",
                                            t('đơn')
                                        ]
                                    })
                                ]
                            }),
                            tooltipRows.length === 0 ? /*#__PURE__*/ (0,jsx_runtime.jsx)("p", {
                                className: "text-[11px] text-gray-400",
                                children: t('Tháng này không có đơn được duyệt')
                            }) : /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
                                className: "space-y-1",
                                children: tooltipRows.map(function(r) {
                                    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                                        className: "flex items-center justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0,jsx_runtime.jsxs)("span", {
                                                className: "inline-flex items-center gap-1.5 min-w-0",
                                                children: [
                                                    /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                                                        className: "w-2 h-2 rounded-full flex-shrink-0",
                                                        style: {
                                                            backgroundColor: r.color
                                                        }
                                                    }),
                                                    /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                                                        className: "text-[11px] text-gray-600 truncate",
                                                        children: r.label
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                                                className: "text-[11px] font-bold text-[#1d1d1f] flex-shrink-0",
                                                children: r.value
                                            })
                                        ]
                                    }, r.key);
                                })
                            }),
                            extra && Object.entries(extra).map(function(param) {
                                var _param = _sliced_to_array(param, 2), k = _param[0], v = _param[1];
                                return /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                                    className: "mt-2 pt-2 border-t border-[#f0eee9] flex items-center justify-between gap-3",
                                    children: [
                                        /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                                            className: "text-[11px] font-semibold text-gray-500",
                                            children: k
                                        }),
                                        /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                                            className: "text-[11px] font-bold text-[#1d1d1f]",
                                            children: v
                                        })
                                    ]
                                }, k);
                            }),
                            changePercents && changePercents[hoverIdx] !== undefined && hoverIdx > 0 && /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
                                className: "mt-2 pt-2 border-t border-[#f0eee9] text-[11px] font-bold ".concat(changePercents[hoverIdx] > 0 ? 'text-emerald-600' : changePercents[hoverIdx] < 0 ? 'text-red-600' : 'text-gray-500'),
                                children: [
                                    changePercents[hoverIdx] > 0 ? '▲' : changePercents[hoverIdx] < 0 ? '▼' : '•',
                                    ' ',
                                    Math.abs(changePercents[hoverIdx]).toFixed(0),
                                    "% ",
                                    t('so với tháng trước')
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
                        className: "absolute inset-0 flex",
                        style: {
                            paddingLeft: PAD.left,
                            paddingRight: PAD.right,
                            paddingTop: PAD.top,
                            paddingBottom: PAD.bottom
                        },
                        onMouseLeave: function onMouseLeave() {
                            return setHoverIdx(null);
                        },
                        children: labels.map(function(lb, i) {
                            return /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
                                className: "flex-1 h-full cursor-crosshair",
                                onMouseEnter: function onMouseEnter() {
                                    return setHoverIdx(i);
                                }
                            }, lb + i);
                        })
                    })
                ]
            })
        ]
    });
}

})();

module.exports = __webpack_exports__;
})()
;