"use weex:vue";

if (typeof Promise !== 'undefined' && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor
    return this.then(
      value => promise.resolve(callback()).then(() => value),
      reason => promise.resolve(callback()).then(() => {
        throw reason
      })
    )
  }
};

if (typeof uni !== 'undefined' && uni && uni.requireGlobal) {
  const global = uni.requireGlobal()
  ArrayBuffer = global.ArrayBuffer
  Int8Array = global.Int8Array
  Uint8Array = global.Uint8Array
  Uint8ClampedArray = global.Uint8ClampedArray
  Int16Array = global.Int16Array
  Uint16Array = global.Uint16Array
  Int32Array = global.Int32Array
  Uint32Array = global.Uint32Array
  Float32Array = global.Float32Array
  Float64Array = global.Float64Array
  BigInt64Array = global.BigInt64Array
  BigUint64Array = global.BigUint64Array
};


(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // vue-ns:vue
  var require_vue = __commonJS({
    "vue-ns:vue"(exports, module) {
      module.exports = Vue;
    }
  });

  // ../../../../Code/Dev/GXA/Client/DevApp/unpackage/dist/dev/.nvue/pages/funs/funs.js
  var import_vue = __toESM(require_vue());
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return typeof component === "string" ? easycom : component;
  }
  var fontData = [
    {
      "font_class": "arrow-down",
      "unicode": "\uE6BE"
    },
    {
      "font_class": "arrow-left",
      "unicode": "\uE6BC"
    },
    {
      "font_class": "arrow-right",
      "unicode": "\uE6BB"
    },
    {
      "font_class": "arrow-up",
      "unicode": "\uE6BD"
    },
    {
      "font_class": "auth",
      "unicode": "\uE6AB"
    },
    {
      "font_class": "auth-filled",
      "unicode": "\uE6CC"
    },
    {
      "font_class": "back",
      "unicode": "\uE6B9"
    },
    {
      "font_class": "bars",
      "unicode": "\uE627"
    },
    {
      "font_class": "calendar",
      "unicode": "\uE6A0"
    },
    {
      "font_class": "calendar-filled",
      "unicode": "\uE6C0"
    },
    {
      "font_class": "camera",
      "unicode": "\uE65A"
    },
    {
      "font_class": "camera-filled",
      "unicode": "\uE658"
    },
    {
      "font_class": "cart",
      "unicode": "\uE631"
    },
    {
      "font_class": "cart-filled",
      "unicode": "\uE6D0"
    },
    {
      "font_class": "chat",
      "unicode": "\uE65D"
    },
    {
      "font_class": "chat-filled",
      "unicode": "\uE659"
    },
    {
      "font_class": "chatboxes",
      "unicode": "\uE696"
    },
    {
      "font_class": "chatboxes-filled",
      "unicode": "\uE692"
    },
    {
      "font_class": "chatbubble",
      "unicode": "\uE697"
    },
    {
      "font_class": "chatbubble-filled",
      "unicode": "\uE694"
    },
    {
      "font_class": "checkbox",
      "unicode": "\uE62B"
    },
    {
      "font_class": "checkbox-filled",
      "unicode": "\uE62C"
    },
    {
      "font_class": "checkmarkempty",
      "unicode": "\uE65C"
    },
    {
      "font_class": "circle",
      "unicode": "\uE65B"
    },
    {
      "font_class": "circle-filled",
      "unicode": "\uE65E"
    },
    {
      "font_class": "clear",
      "unicode": "\uE66D"
    },
    {
      "font_class": "close",
      "unicode": "\uE673"
    },
    {
      "font_class": "closeempty",
      "unicode": "\uE66C"
    },
    {
      "font_class": "cloud-download",
      "unicode": "\uE647"
    },
    {
      "font_class": "cloud-download-filled",
      "unicode": "\uE646"
    },
    {
      "font_class": "cloud-upload",
      "unicode": "\uE645"
    },
    {
      "font_class": "cloud-upload-filled",
      "unicode": "\uE648"
    },
    {
      "font_class": "color",
      "unicode": "\uE6CF"
    },
    {
      "font_class": "color-filled",
      "unicode": "\uE6C9"
    },
    {
      "font_class": "compose",
      "unicode": "\uE67F"
    },
    {
      "font_class": "contact",
      "unicode": "\uE693"
    },
    {
      "font_class": "contact-filled",
      "unicode": "\uE695"
    },
    {
      "font_class": "down",
      "unicode": "\uE6B8"
    },
    {
      "font_class": "bottom",
      "unicode": "\uE6B8"
    },
    {
      "font_class": "download",
      "unicode": "\uE68D"
    },
    {
      "font_class": "download-filled",
      "unicode": "\uE681"
    },
    {
      "font_class": "email",
      "unicode": "\uE69E"
    },
    {
      "font_class": "email-filled",
      "unicode": "\uE69A"
    },
    {
      "font_class": "eye",
      "unicode": "\uE651"
    },
    {
      "font_class": "eye-filled",
      "unicode": "\uE66A"
    },
    {
      "font_class": "eye-slash",
      "unicode": "\uE6B3"
    },
    {
      "font_class": "eye-slash-filled",
      "unicode": "\uE6B4"
    },
    {
      "font_class": "fire",
      "unicode": "\uE6A1"
    },
    {
      "font_class": "fire-filled",
      "unicode": "\uE6C5"
    },
    {
      "font_class": "flag",
      "unicode": "\uE65F"
    },
    {
      "font_class": "flag-filled",
      "unicode": "\uE660"
    },
    {
      "font_class": "folder-add",
      "unicode": "\uE6A9"
    },
    {
      "font_class": "folder-add-filled",
      "unicode": "\uE6C8"
    },
    {
      "font_class": "font",
      "unicode": "\uE6A3"
    },
    {
      "font_class": "forward",
      "unicode": "\uE6BA"
    },
    {
      "font_class": "gear",
      "unicode": "\uE664"
    },
    {
      "font_class": "gear-filled",
      "unicode": "\uE661"
    },
    {
      "font_class": "gift",
      "unicode": "\uE6A4"
    },
    {
      "font_class": "gift-filled",
      "unicode": "\uE6C4"
    },
    {
      "font_class": "hand-down",
      "unicode": "\uE63D"
    },
    {
      "font_class": "hand-down-filled",
      "unicode": "\uE63C"
    },
    {
      "font_class": "hand-up",
      "unicode": "\uE63F"
    },
    {
      "font_class": "hand-up-filled",
      "unicode": "\uE63E"
    },
    {
      "font_class": "headphones",
      "unicode": "\uE630"
    },
    {
      "font_class": "heart",
      "unicode": "\uE639"
    },
    {
      "font_class": "heart-filled",
      "unicode": "\uE641"
    },
    {
      "font_class": "help",
      "unicode": "\uE679"
    },
    {
      "font_class": "help-filled",
      "unicode": "\uE674"
    },
    {
      "font_class": "home",
      "unicode": "\uE662"
    },
    {
      "font_class": "home-filled",
      "unicode": "\uE663"
    },
    {
      "font_class": "image",
      "unicode": "\uE670"
    },
    {
      "font_class": "image-filled",
      "unicode": "\uE678"
    },
    {
      "font_class": "images",
      "unicode": "\uE650"
    },
    {
      "font_class": "images-filled",
      "unicode": "\uE64B"
    },
    {
      "font_class": "info",
      "unicode": "\uE669"
    },
    {
      "font_class": "info-filled",
      "unicode": "\uE649"
    },
    {
      "font_class": "left",
      "unicode": "\uE6B7"
    },
    {
      "font_class": "link",
      "unicode": "\uE6A5"
    },
    {
      "font_class": "list",
      "unicode": "\uE644"
    },
    {
      "font_class": "location",
      "unicode": "\uE6AE"
    },
    {
      "font_class": "location-filled",
      "unicode": "\uE6AF"
    },
    {
      "font_class": "locked",
      "unicode": "\uE66B"
    },
    {
      "font_class": "locked-filled",
      "unicode": "\uE668"
    },
    {
      "font_class": "loop",
      "unicode": "\uE633"
    },
    {
      "font_class": "mail-open",
      "unicode": "\uE643"
    },
    {
      "font_class": "mail-open-filled",
      "unicode": "\uE63A"
    },
    {
      "font_class": "map",
      "unicode": "\uE667"
    },
    {
      "font_class": "map-filled",
      "unicode": "\uE666"
    },
    {
      "font_class": "map-pin",
      "unicode": "\uE6AD"
    },
    {
      "font_class": "map-pin-ellipse",
      "unicode": "\uE6AC"
    },
    {
      "font_class": "medal",
      "unicode": "\uE6A2"
    },
    {
      "font_class": "medal-filled",
      "unicode": "\uE6C3"
    },
    {
      "font_class": "mic",
      "unicode": "\uE671"
    },
    {
      "font_class": "mic-filled",
      "unicode": "\uE677"
    },
    {
      "font_class": "micoff",
      "unicode": "\uE67E"
    },
    {
      "font_class": "micoff-filled",
      "unicode": "\uE6B0"
    },
    {
      "font_class": "minus",
      "unicode": "\uE66F"
    },
    {
      "font_class": "minus-filled",
      "unicode": "\uE67D"
    },
    {
      "font_class": "more",
      "unicode": "\uE64D"
    },
    {
      "font_class": "more-filled",
      "unicode": "\uE64E"
    },
    {
      "font_class": "navigate",
      "unicode": "\uE66E"
    },
    {
      "font_class": "navigate-filled",
      "unicode": "\uE67A"
    },
    {
      "font_class": "notification",
      "unicode": "\uE6A6"
    },
    {
      "font_class": "notification-filled",
      "unicode": "\uE6C1"
    },
    {
      "font_class": "paperclip",
      "unicode": "\uE652"
    },
    {
      "font_class": "paperplane",
      "unicode": "\uE672"
    },
    {
      "font_class": "paperplane-filled",
      "unicode": "\uE675"
    },
    {
      "font_class": "person",
      "unicode": "\uE699"
    },
    {
      "font_class": "person-filled",
      "unicode": "\uE69D"
    },
    {
      "font_class": "personadd",
      "unicode": "\uE69F"
    },
    {
      "font_class": "personadd-filled",
      "unicode": "\uE698"
    },
    {
      "font_class": "personadd-filled-copy",
      "unicode": "\uE6D1"
    },
    {
      "font_class": "phone",
      "unicode": "\uE69C"
    },
    {
      "font_class": "phone-filled",
      "unicode": "\uE69B"
    },
    {
      "font_class": "plus",
      "unicode": "\uE676"
    },
    {
      "font_class": "plus-filled",
      "unicode": "\uE6C7"
    },
    {
      "font_class": "plusempty",
      "unicode": "\uE67B"
    },
    {
      "font_class": "pulldown",
      "unicode": "\uE632"
    },
    {
      "font_class": "pyq",
      "unicode": "\uE682"
    },
    {
      "font_class": "qq",
      "unicode": "\uE680"
    },
    {
      "font_class": "redo",
      "unicode": "\uE64A"
    },
    {
      "font_class": "redo-filled",
      "unicode": "\uE655"
    },
    {
      "font_class": "refresh",
      "unicode": "\uE657"
    },
    {
      "font_class": "refresh-filled",
      "unicode": "\uE656"
    },
    {
      "font_class": "refreshempty",
      "unicode": "\uE6BF"
    },
    {
      "font_class": "reload",
      "unicode": "\uE6B2"
    },
    {
      "font_class": "right",
      "unicode": "\uE6B5"
    },
    {
      "font_class": "scan",
      "unicode": "\uE62A"
    },
    {
      "font_class": "search",
      "unicode": "\uE654"
    },
    {
      "font_class": "settings",
      "unicode": "\uE653"
    },
    {
      "font_class": "settings-filled",
      "unicode": "\uE6CE"
    },
    {
      "font_class": "shop",
      "unicode": "\uE62F"
    },
    {
      "font_class": "shop-filled",
      "unicode": "\uE6CD"
    },
    {
      "font_class": "smallcircle",
      "unicode": "\uE67C"
    },
    {
      "font_class": "smallcircle-filled",
      "unicode": "\uE665"
    },
    {
      "font_class": "sound",
      "unicode": "\uE684"
    },
    {
      "font_class": "sound-filled",
      "unicode": "\uE686"
    },
    {
      "font_class": "spinner-cycle",
      "unicode": "\uE68A"
    },
    {
      "font_class": "staff",
      "unicode": "\uE6A7"
    },
    {
      "font_class": "staff-filled",
      "unicode": "\uE6CB"
    },
    {
      "font_class": "star",
      "unicode": "\uE688"
    },
    {
      "font_class": "star-filled",
      "unicode": "\uE68F"
    },
    {
      "font_class": "starhalf",
      "unicode": "\uE683"
    },
    {
      "font_class": "trash",
      "unicode": "\uE687"
    },
    {
      "font_class": "trash-filled",
      "unicode": "\uE685"
    },
    {
      "font_class": "tune",
      "unicode": "\uE6AA"
    },
    {
      "font_class": "tune-filled",
      "unicode": "\uE6CA"
    },
    {
      "font_class": "undo",
      "unicode": "\uE64F"
    },
    {
      "font_class": "undo-filled",
      "unicode": "\uE64C"
    },
    {
      "font_class": "up",
      "unicode": "\uE6B6"
    },
    {
      "font_class": "top",
      "unicode": "\uE6B6"
    },
    {
      "font_class": "upload",
      "unicode": "\uE690"
    },
    {
      "font_class": "upload-filled",
      "unicode": "\uE68E"
    },
    {
      "font_class": "videocam",
      "unicode": "\uE68C"
    },
    {
      "font_class": "videocam-filled",
      "unicode": "\uE689"
    },
    {
      "font_class": "vip",
      "unicode": "\uE6A8"
    },
    {
      "font_class": "vip-filled",
      "unicode": "\uE6C6"
    },
    {
      "font_class": "wallet",
      "unicode": "\uE6B1"
    },
    {
      "font_class": "wallet-filled",
      "unicode": "\uE6C2"
    },
    {
      "font_class": "weibo",
      "unicode": "\uE68B"
    },
    {
      "font_class": "weixin",
      "unicode": "\uE691"
    }
  ];
  var iconUrl = "/assets/uniicons.32e978a5.ttf";
  var _style_0$2 = { "uni-icons": { "": { "fontFamily": "uniicons", "textDecoration": "none", "textAlign": "center" } } };
  var _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  var getVal = (val) => {
    const reg = /^[0-9]*$/g;
    return typeof val === "number" || reg.test(val) ? val + "px" : val;
  };
  var domModule = weex.requireModule("dom");
  domModule.addRule("fontFace", {
    "fontFamily": "uniicons",
    "src": "url('" + iconUrl + "')"
  });
  var _sfc_main$2 = {
    name: "UniIcons",
    emits: ["click"],
    props: {
      type: {
        type: String,
        default: ""
      },
      color: {
        type: String,
        default: "#333333"
      },
      size: {
        type: [Number, String],
        default: 16
      },
      customPrefix: {
        type: String,
        default: ""
      },
      fontFamily: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        icons: fontData
      };
    },
    computed: {
      unicode() {
        let code = this.icons.find((v) => v.font_class === this.type);
        if (code) {
          return code.unicode;
        }
        return "";
      },
      iconSize() {
        return getVal(this.size);
      },
      styleObj() {
        if (this.fontFamily !== "") {
          return `color: ${this.color}; font-size: ${this.iconSize}; font-family: ${this.fontFamily};`;
        }
        return `color: ${this.color}; font-size: ${this.iconSize};`;
      }
    },
    methods: {
      _onClick() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return (0, import_vue.openBlock)(), (0, import_vue.createElementBlock)(
      "u-text",
      {
        style: (0, import_vue.normalizeStyle)($options.styleObj),
        class: "uni-icons",
        onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
      },
      (0, import_vue.toDisplayString)($options.unicode),
      5
      /* TEXT, STYLE */
    );
  }
  var __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["styles", [_style_0$2]], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
  var _style_0$1 = { "you-touchbox": { "": { "position": "fixed", "left": 0, "right": 0 } }, "touchend": { "": { "transitionProperty": "top", "transitionDuration": 1e3 } }, "you-touchbox-content": { "": { "flex": 1, "backgroundColor": "#ffffff" } }, "touch-line-box": { "": { "paddingTop": 5, "paddingRight": 0, "paddingBottom": 10, "paddingLeft": 0, "alignItems": "center" } }, "touch-line": { "": { "width": 45, "height": 5, "borderRadius": 25, "backgroundColor": "rgba(51,51,51,0.2)" } }, "@TRANSITION": { "touchend": { "property": "top", "duration": 1e3 } } };
  var _sfc_main$1 = {
    name: "you-touchbox",
    props: {
      // 禁用滑动
      disable: {
        type: Boolean,
        default: false
      },
      zIndex: {
        type: [Number, String],
        default: 100
      },
      // 自定义样式
      customStyle: [String, Object],
      // 自定义安全区域
      customSafeArea: {
        type: Object,
        default() {
          return {
            h5Top: null,
            wxTop: null,
            bottom: null
          };
        }
      },
      // 最高top
      maxTop: {
        type: [Number, String],
        default: 1
      },
      // 最低top
      minTop: {
        type: [Number, String],
        default: 0.5
      },
      // 初始top
      initTop: {
        type: [Number, String],
        default: "min"
      },
      // 自动复位
      auto: {
        type: Boolean,
        default: true
      },
      // 最高最低限制
      limit: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        windowHeight: null,
        // 可使用区域高度
        windowTop: null,
        touchStartY: null,
        // 开始滑动时的Y轴坐标
        top: null,
        // 上拉框top
        max: null,
        // maxTop
        min: null,
        // minTop
        distance: 0,
        // 滑动距离
        isTouchEnd: false,
        // 是否滑动结束Flag
        boundary: null,
        // 规定盒子复位为最大或最小状态的分界线，默认为最大最小状态的中间
        startTime: null
        // 开始滑动时间
      };
    },
    mounted() {
      let {
        windowHeight,
        // 可使用窗口高度
        windowTop
        // 可使用窗口的顶部位置
      } = uni.getSystemInfoSync();
      this.windowHeight = windowHeight;
      this.windowTop = windowTop;
      let {
        h5Top,
        wxTop,
        bottom
      } = this.customSafeArea;
      if (h5Top) {
        this.windowHeight -= h5Top;
        windowTop += h5Top;
      }
      if (bottom)
        this.windowHeight -= bottom;
      if (this.maxTop <= 1)
        this.max = this.windowHeight * (1 - +this.maxTop);
      else
        this.max = +this.maxTop;
      if (this.minTop <= 1)
        this.min = this.windowHeight * (1 - +this.minTop);
      else
        this.min = this.windowHeight - +this.minTop;
      if (["min", "max"].includes(this.initTop))
        this.top = this.initTop === "min" ? this.min : this.max;
      else if (this.initTop <= 1)
        this.top = this.windowHeight * (1 - +this.initTop);
      else
        this.top = +this.initTop;
      this.max += windowTop;
      this.min += windowTop;
      this.top += windowTop;
      this.boundary = (this.max + this.min) / 2;
    },
    methods: {
      setBottom(value) {
        if (this.auto)
          this.isTouchEnd = true;
        if (value <= 1)
          this.top = this.windowHeight * (1 - +value);
        else
          this.top = this.windowHeight - +value;
        this.top += this.windowTop;
      },
      onTouchStart(e) {
        if (this.disable)
          return;
        this.isTouchEnd = false;
        this.touchStartY = e.touches[0].screenY;
        this.startTime = Date.now();
      },
      onTouchmove(e) {
        if (this.disable)
          return;
        let distance = e.touches[0].screenY - this.touchStartY;
        if (this.limit) {
          let nowTop = this.top + distance;
          if (nowTop < this.max || nowTop > this.min) {
            this.top = nowTop < this.max ? this.max : this.min;
            this.distance = 0;
            this.touchStartY = e.touches[0].screenY;
            return;
          }
        }
        this.distance = distance;
      },
      onTouchend(e) {
        if (this.disable)
          return;
        this.top = this.top + this.distance;
        if (this.auto) {
          this.isTouchEnd = true;
          let time = (Date.now() - this.startTime) / 1e3;
          let speed = Math.abs(this.distance) / time;
          if (speed > 800) {
            this.top = this.distance > 0 ? this.min : this.max;
          } else {
            if (this.top < this.boundary)
              this.top = this.max;
            else
              this.top = this.min;
          }
        }
        this.$emit("get-end-detail", {
          minTop: this.min,
          maxTop: this.max,
          curTop: this.top
        });
        this.distance = 0;
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return (0, import_vue.openBlock)(), (0, import_vue.createElementBlock)(
      "view",
      {
        class: (0, import_vue.normalizeClass)(["you-touchbox", { touchend: $data.isTouchEnd }]),
        onTouchstart: _cache[1] || (_cache[1] = (...args) => $options.onTouchStart && $options.onTouchStart(...args)),
        onTouchmove: _cache[2] || (_cache[2] = (0, import_vue.withModifiers)((...args) => $options.onTouchmove && $options.onTouchmove(...args), ["stop", "prevent"])),
        onTouchend: _cache[3] || (_cache[3] = (...args) => $options.onTouchend && $options.onTouchend(...args)),
        style: (0, import_vue.normalizeStyle)({ top: $data.top + $data.distance + "px", zIndex: $props.zIndex, height: $data.windowHeight + "px" }),
        renderWhole: true
      },
      [
        (0, import_vue.createElementVNode)(
          "view",
          {
            class: "you-touchbox-content",
            style: (0, import_vue.normalizeStyle)($props.customStyle),
            onClick: _cache[0] || (_cache[0] = (0, import_vue.withModifiers)(() => {
            }, ["stop", "prevent"]))
          },
          [
            (0, import_vue.createElementVNode)("view", { class: "touch-line-box" }, [
              (0, import_vue.createElementVNode)("view", { class: "touch-line" })
            ]),
            (0, import_vue.renderSlot)(_ctx.$slots, "default")
          ],
          4
          /* STYLE */
        )
      ],
      38
      /* CLASS, STYLE, NEED_HYDRATION */
    );
  }
  var __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["styles", [_style_0$1]], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/you-touchbox/components/you-touchbox/you-touchbox.vue"]]);
  var _style_0 = { "mao": { "": { "height": "1500rpx", "width": "700rpx", "display": "flex" } }, "search-box": { "": { "backgroundColor": "#f5f5f5", "borderRadius": 30, "paddingTop": 12, "paddingRight": 20, "paddingBottom": 12, "paddingLeft": 20, "display": "flex", "flexDirection": "row", "alignItems": "center", "marginTop": 0, "marginRight": 20, "marginBottom": 20, "marginLeft": 20 } }, "search-input": { "": { "flex": 1, "borderWidth": 0, "borderColor": "#000000", "backgroundColor": "rgba(0,0,0,0)", "fontSize": 16, "outline": "none", "marginLeft": 10 } }, "quick-actions": { "": { "display": "flex", "flexDirection": "row", "justifyContent": "space-around", "paddingTop": 15, "paddingRight": 20, "paddingBottom": 15, "paddingLeft": 20, "borderBottomWidth": 1, "borderBottomStyle": "solid", "borderBottomColor": "#f0f0f0" } }, "action-item": { "": { "display": "flex", "flexDirection": "column", "alignItems": "center" } }, "action-icon": { "": { "width": 60, "height": 60, "borderRadius": 20, "display": "flex", "alignItems": "center", "justifyContent": "center", "marginBottom": 8 } }, "action-text": { "": { "fontSize": 13, "color": "#555555" } } };
  var _sfc_main = {
    __name: "funs",
    setup(__props, { expose: __expose }) {
      __expose();
      const myMap = (0, import_vue.ref)();
      const mintop = (0, import_vue.ref)(100);
      const actions = (0, import_vue.ref)([
        { icon: "map", text: "\u8B66\u60C5", bgColor: "#e6f4ff", color: "#0089ff" },
        { icon: "home", text: "\u573A\u6240", bgColor: "#e6f4ff", color: "#0089ff" },
        { icon: "person", text: "\u4EBA\u5458", bgColor: "#e6f4ff", color: "#0089ff" },
        { icon: "fire", text: "\u5316\u77DB", bgColor: "#e6f4ff", color: "#0089ff" },
        { icon: "map-pin", text: "\u5F85\u5B9A", bgColor: "#e6f4ff", color: "#0089ff" }
      ]);
      const latitude = (0, import_vue.ref)(0);
      const longitude = (0, import_vue.ref)(0);
      function getLocal() {
        uni.getLocation({
          type: "gcj02",
          isHighAccuracy: true,
          //高精度
          geocode: true,
          //将位置解析成地址
          success: (res) => {
            formatAppLog("log", "at pages/funs/funs.nvue:45", res);
            latitude.value = res.latitude;
            longitude.value = res.longitude;
            formatAppLog("log", "at pages/funs/funs.nvue:48", latitude.value);
          }
        });
      }
      function movedital(e) {
        formatAppLog("log", "at pages/funs/funs.nvue:55", e.curTop);
        if (e.curTop < 300)
          ;
      }
      getLocal();
      const __returned__ = { myMap, mintop, actions, latitude, longitude, getLocal, movedital, ref: import_vue.ref };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom((0, import_vue.resolveDynamicComponent)("uni-icons"), __easycom_0);
    const _component_you_touchbox = resolveEasycom((0, import_vue.resolveDynamicComponent)("you-touchbox"), __easycom_1);
    return (0, import_vue.openBlock)(), (0, import_vue.createElementBlock)("scroll-view", {
      scrollY: true,
      showScrollbar: true,
      enableBackToTop: true,
      bubble: "true",
      style: { flexDirection: "column" }
    }, [
      (0, import_vue.createElementVNode)("view", { class: "" }, [
        (0, import_vue.createElementVNode)("map", {
          class: "mao",
          showLocation: true,
          latitude: $setup.latitude,
          longitude: $setup.longitude
        }, null, 8, ["latitude", "longitude"]),
        (0, import_vue.createVNode)(_component_you_touchbox, {
          ref: "myMap",
          minTop: $setup.mintop,
          auto: false,
          onGetEndDetail: $setup.movedital
        }, {
          default: (0, import_vue.withCtx)(() => [
            (0, import_vue.createElementVNode)("view", { class: "search-box" }, [
              (0, import_vue.createVNode)(_component_uni_icons, {
                type: "search",
                size: "18",
                color: "#999"
              }),
              (0, import_vue.createElementVNode)("u-input", {
                class: "search-input",
                type: "text",
                placeholder: "\u641C\u7D22\u8B66\u60C5\u3001\u4EBA\u5458\u3001\u573A\u6240"
              })
            ]),
            (0, import_vue.createElementVNode)("view", { class: "quick-actions" }, [
              ((0, import_vue.openBlock)(true), (0, import_vue.createElementBlock)(
                import_vue.Fragment,
                null,
                (0, import_vue.renderList)($setup.actions, (action, index) => {
                  return (0, import_vue.openBlock)(), (0, import_vue.createElementBlock)("view", {
                    class: "action-item",
                    key: index
                  }, [
                    (0, import_vue.createElementVNode)(
                      "view",
                      {
                        class: "action-icon",
                        style: (0, import_vue.normalizeStyle)({ backgroundColor: action.bgColor })
                      },
                      [
                        (0, import_vue.createVNode)(_component_uni_icons, {
                          type: action.icon,
                          size: "24",
                          color: action.color
                        }, null, 8, ["type", "color"])
                      ],
                      4
                      /* STYLE */
                    ),
                    (0, import_vue.createElementVNode)(
                      "u-text",
                      { class: "action-text" },
                      (0, import_vue.toDisplayString)(action.text),
                      1
                      /* TEXT */
                    )
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ]),
          _: 1
          /* STABLE */
        }, 8, ["minTop"])
      ])
    ]);
  }
  var funs = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["styles", [_style_0]], ["__file", "D:/Code/Dev/GXA/Client/DevApp/pages/funs/funs.nvue"]]);

  // <stdin>
  var webview = plus.webview.currentWebview();
  if (webview) {
    const __pageId = parseInt(webview.id);
    const __pagePath = "pages/funs/funs";
    let __pageQuery = {};
    try {
      __pageQuery = JSON.parse(webview.__query__);
    } catch (e) {
    }
    funs.mpType = "page";
    const app = Vue.createPageApp(funs, { $store: getApp({ allowDefault: true }).$store, __pageId, __pagePath, __pageQuery });
    app.provide("__globalStyles", Vue.useCssStyles([...__uniConfig.styles, ...funs.styles || []]));
    app.mount("#root");
  }
})();
