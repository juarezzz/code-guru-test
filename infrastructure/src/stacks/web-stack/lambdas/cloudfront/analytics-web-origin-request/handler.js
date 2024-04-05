"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.handler = void 0;
var handler = function (event, _, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var request, response_1, clientIp, headers, ip, ios_viewer, android_viewer, country_name, country_region_name, latitude, longitude, city, timezone, postal_code, data, response;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    return __generator(this, function (_u) {
        request = event.Records[0].cf.request;
        if (request.method !== 'GET') {
            response_1 = {
                status: '405',
                statusDescription: 'Method Not Allowed',
                headers: {
                    'cache-control': [
                        {
                            key: 'Cache-Control',
                            value: 'max-age=1'
                        },
                    ],
                    'content-type': [
                        {
                            key: 'Content-Type',
                            value: 'application/json'
                        },
                    ],
                    'access-control-allow-origin': [
                        {
                            key: 'Access-Control-Allow-Origin',
                            value: '*'
                        },
                    ]
                },
                body: JSON.stringify({})
            };
            return [2 /*return*/, callback(null, response_1)];
        }
        console.dir({ request: request }, { depth: null });
        clientIp = request.clientIp, headers = request.headers;
        ip = clientIp;
        ios_viewer = headers["cloudfront-is-ios-viewer"], android_viewer = headers["cloudfront-is-android-viewer"], country_name = headers["cloudfront-viewer-country-name"], country_region_name = headers["cloudfront-viewer-country-region-name"], latitude = headers["cloudfront-viewer-latitude"], longitude = headers["cloudfront-viewer-longitude"], city = headers["cloudfront-viewer-city"], timezone = headers["cloudfront-viewer-time-zone"], postal_code = headers["cloudfront-viewer-postal-code"];
        data = {
            ip: ip,
            ios_viewer: (_b = (_a = ios_viewer === null || ios_viewer === void 0 ? void 0 : ios_viewer[0]) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 'null',
            android_viewer: (_d = (_c = android_viewer === null || android_viewer === void 0 ? void 0 : android_viewer[0]) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 'null',
            country_name: (_f = (_e = country_name === null || country_name === void 0 ? void 0 : country_name[0]) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : 'null',
            country_region_name: (_h = (_g = country_region_name === null || country_region_name === void 0 ? void 0 : country_region_name[0]) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : 'null',
            latitude: (_k = (_j = latitude === null || latitude === void 0 ? void 0 : latitude[0]) === null || _j === void 0 ? void 0 : _j.value) !== null && _k !== void 0 ? _k : 'null',
            longitude: (_m = (_l = longitude === null || longitude === void 0 ? void 0 : longitude[0]) === null || _l === void 0 ? void 0 : _l.value) !== null && _m !== void 0 ? _m : 'null',
            city: (_p = (_o = city === null || city === void 0 ? void 0 : city[0]) === null || _o === void 0 ? void 0 : _o.value) !== null && _p !== void 0 ? _p : 'null',
            timezone: (_r = (_q = timezone === null || timezone === void 0 ? void 0 : timezone[0]) === null || _q === void 0 ? void 0 : _q.value) !== null && _r !== void 0 ? _r : 'null',
            postal_code: (_t = (_s = postal_code === null || postal_code === void 0 ? void 0 : postal_code[0]) === null || _s === void 0 ? void 0 : _s.value) !== null && _t !== void 0 ? _t : 'null'
        };
        console.dir({ data: data }, { depth: null });
        response = {
            status: '200',
            statusDescription: 'OK',
            headers: {
                'cache-control': [
                    {
                        key: 'Cache-Control',
                        value: 'max-age=1'
                    },
                ],
                'content-type': [
                    {
                        key: 'Content-Type',
                        value: 'application/json'
                    },
                ],
                'access-control-allow-origin': [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*'
                    },
                ]
            },
            body: JSON.stringify(__assign({}, data))
        };
        return [2 /*return*/, callback(null, response)];
    });
}); };
exports.handler = handler;
