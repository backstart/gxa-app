import { openBlock, createElementBlock, normalizeStyle, toDisplayString, normalizeClass, withModifiers, createElementVNode, renderSlot, ref, resolveDynamicComponent, createVNode, withCtx, Fragment, renderList } from "vue";
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
const fontData = [
  {
    "font_class": "arrow-down",
    "unicode": ""
  },
  {
    "font_class": "arrow-left",
    "unicode": ""
  },
  {
    "font_class": "arrow-right",
    "unicode": ""
  },
  {
    "font_class": "arrow-up",
    "unicode": ""
  },
  {
    "font_class": "auth",
    "unicode": ""
  },
  {
    "font_class": "auth-filled",
    "unicode": ""
  },
  {
    "font_class": "back",
    "unicode": ""
  },
  {
    "font_class": "bars",
    "unicode": ""
  },
  {
    "font_class": "calendar",
    "unicode": ""
  },
  {
    "font_class": "calendar-filled",
    "unicode": ""
  },
  {
    "font_class": "camera",
    "unicode": ""
  },
  {
    "font_class": "camera-filled",
    "unicode": ""
  },
  {
    "font_class": "cart",
    "unicode": ""
  },
  {
    "font_class": "cart-filled",
    "unicode": ""
  },
  {
    "font_class": "chat",
    "unicode": ""
  },
  {
    "font_class": "chat-filled",
    "unicode": ""
  },
  {
    "font_class": "chatboxes",
    "unicode": ""
  },
  {
    "font_class": "chatboxes-filled",
    "unicode": ""
  },
  {
    "font_class": "chatbubble",
    "unicode": ""
  },
  {
    "font_class": "chatbubble-filled",
    "unicode": ""
  },
  {
    "font_class": "checkbox",
    "unicode": ""
  },
  {
    "font_class": "checkbox-filled",
    "unicode": ""
  },
  {
    "font_class": "checkmarkempty",
    "unicode": ""
  },
  {
    "font_class": "circle",
    "unicode": ""
  },
  {
    "font_class": "circle-filled",
    "unicode": ""
  },
  {
    "font_class": "clear",
    "unicode": ""
  },
  {
    "font_class": "close",
    "unicode": ""
  },
  {
    "font_class": "closeempty",
    "unicode": ""
  },
  {
    "font_class": "cloud-download",
    "unicode": ""
  },
  {
    "font_class": "cloud-download-filled",
    "unicode": ""
  },
  {
    "font_class": "cloud-upload",
    "unicode": ""
  },
  {
    "font_class": "cloud-upload-filled",
    "unicode": ""
  },
  {
    "font_class": "color",
    "unicode": ""
  },
  {
    "font_class": "color-filled",
    "unicode": ""
  },
  {
    "font_class": "compose",
    "unicode": ""
  },
  {
    "font_class": "contact",
    "unicode": ""
  },
  {
    "font_class": "contact-filled",
    "unicode": ""
  },
  {
    "font_class": "down",
    "unicode": ""
  },
  {
    "font_class": "bottom",
    "unicode": ""
  },
  {
    "font_class": "download",
    "unicode": ""
  },
  {
    "font_class": "download-filled",
    "unicode": ""
  },
  {
    "font_class": "email",
    "unicode": ""
  },
  {
    "font_class": "email-filled",
    "unicode": ""
  },
  {
    "font_class": "eye",
    "unicode": ""
  },
  {
    "font_class": "eye-filled",
    "unicode": ""
  },
  {
    "font_class": "eye-slash",
    "unicode": ""
  },
  {
    "font_class": "eye-slash-filled",
    "unicode": ""
  },
  {
    "font_class": "fire",
    "unicode": ""
  },
  {
    "font_class": "fire-filled",
    "unicode": ""
  },
  {
    "font_class": "flag",
    "unicode": ""
  },
  {
    "font_class": "flag-filled",
    "unicode": ""
  },
  {
    "font_class": "folder-add",
    "unicode": ""
  },
  {
    "font_class": "folder-add-filled",
    "unicode": ""
  },
  {
    "font_class": "font",
    "unicode": ""
  },
  {
    "font_class": "forward",
    "unicode": ""
  },
  {
    "font_class": "gear",
    "unicode": ""
  },
  {
    "font_class": "gear-filled",
    "unicode": ""
  },
  {
    "font_class": "gift",
    "unicode": ""
  },
  {
    "font_class": "gift-filled",
    "unicode": ""
  },
  {
    "font_class": "hand-down",
    "unicode": ""
  },
  {
    "font_class": "hand-down-filled",
    "unicode": ""
  },
  {
    "font_class": "hand-up",
    "unicode": ""
  },
  {
    "font_class": "hand-up-filled",
    "unicode": ""
  },
  {
    "font_class": "headphones",
    "unicode": ""
  },
  {
    "font_class": "heart",
    "unicode": ""
  },
  {
    "font_class": "heart-filled",
    "unicode": ""
  },
  {
    "font_class": "help",
    "unicode": ""
  },
  {
    "font_class": "help-filled",
    "unicode": ""
  },
  {
    "font_class": "home",
    "unicode": ""
  },
  {
    "font_class": "home-filled",
    "unicode": ""
  },
  {
    "font_class": "image",
    "unicode": ""
  },
  {
    "font_class": "image-filled",
    "unicode": ""
  },
  {
    "font_class": "images",
    "unicode": ""
  },
  {
    "font_class": "images-filled",
    "unicode": ""
  },
  {
    "font_class": "info",
    "unicode": ""
  },
  {
    "font_class": "info-filled",
    "unicode": ""
  },
  {
    "font_class": "left",
    "unicode": ""
  },
  {
    "font_class": "link",
    "unicode": ""
  },
  {
    "font_class": "list",
    "unicode": ""
  },
  {
    "font_class": "location",
    "unicode": ""
  },
  {
    "font_class": "location-filled",
    "unicode": ""
  },
  {
    "font_class": "locked",
    "unicode": ""
  },
  {
    "font_class": "locked-filled",
    "unicode": ""
  },
  {
    "font_class": "loop",
    "unicode": ""
  },
  {
    "font_class": "mail-open",
    "unicode": ""
  },
  {
    "font_class": "mail-open-filled",
    "unicode": ""
  },
  {
    "font_class": "map",
    "unicode": ""
  },
  {
    "font_class": "map-filled",
    "unicode": ""
  },
  {
    "font_class": "map-pin",
    "unicode": ""
  },
  {
    "font_class": "map-pin-ellipse",
    "unicode": ""
  },
  {
    "font_class": "medal",
    "unicode": ""
  },
  {
    "font_class": "medal-filled",
    "unicode": ""
  },
  {
    "font_class": "mic",
    "unicode": ""
  },
  {
    "font_class": "mic-filled",
    "unicode": ""
  },
  {
    "font_class": "micoff",
    "unicode": ""
  },
  {
    "font_class": "micoff-filled",
    "unicode": ""
  },
  {
    "font_class": "minus",
    "unicode": ""
  },
  {
    "font_class": "minus-filled",
    "unicode": ""
  },
  {
    "font_class": "more",
    "unicode": ""
  },
  {
    "font_class": "more-filled",
    "unicode": ""
  },
  {
    "font_class": "navigate",
    "unicode": ""
  },
  {
    "font_class": "navigate-filled",
    "unicode": ""
  },
  {
    "font_class": "notification",
    "unicode": ""
  },
  {
    "font_class": "notification-filled",
    "unicode": ""
  },
  {
    "font_class": "paperclip",
    "unicode": ""
  },
  {
    "font_class": "paperplane",
    "unicode": ""
  },
  {
    "font_class": "paperplane-filled",
    "unicode": ""
  },
  {
    "font_class": "person",
    "unicode": ""
  },
  {
    "font_class": "person-filled",
    "unicode": ""
  },
  {
    "font_class": "personadd",
    "unicode": ""
  },
  {
    "font_class": "personadd-filled",
    "unicode": ""
  },
  {
    "font_class": "personadd-filled-copy",
    "unicode": ""
  },
  {
    "font_class": "phone",
    "unicode": ""
  },
  {
    "font_class": "phone-filled",
    "unicode": ""
  },
  {
    "font_class": "plus",
    "unicode": ""
  },
  {
    "font_class": "plus-filled",
    "unicode": ""
  },
  {
    "font_class": "plusempty",
    "unicode": ""
  },
  {
    "font_class": "pulldown",
    "unicode": ""
  },
  {
    "font_class": "pyq",
    "unicode": ""
  },
  {
    "font_class": "qq",
    "unicode": ""
  },
  {
    "font_class": "redo",
    "unicode": ""
  },
  {
    "font_class": "redo-filled",
    "unicode": ""
  },
  {
    "font_class": "refresh",
    "unicode": ""
  },
  {
    "font_class": "refresh-filled",
    "unicode": ""
  },
  {
    "font_class": "refreshempty",
    "unicode": ""
  },
  {
    "font_class": "reload",
    "unicode": ""
  },
  {
    "font_class": "right",
    "unicode": ""
  },
  {
    "font_class": "scan",
    "unicode": ""
  },
  {
    "font_class": "search",
    "unicode": ""
  },
  {
    "font_class": "settings",
    "unicode": ""
  },
  {
    "font_class": "settings-filled",
    "unicode": ""
  },
  {
    "font_class": "shop",
    "unicode": ""
  },
  {
    "font_class": "shop-filled",
    "unicode": ""
  },
  {
    "font_class": "smallcircle",
    "unicode": ""
  },
  {
    "font_class": "smallcircle-filled",
    "unicode": ""
  },
  {
    "font_class": "sound",
    "unicode": ""
  },
  {
    "font_class": "sound-filled",
    "unicode": ""
  },
  {
    "font_class": "spinner-cycle",
    "unicode": ""
  },
  {
    "font_class": "staff",
    "unicode": ""
  },
  {
    "font_class": "staff-filled",
    "unicode": ""
  },
  {
    "font_class": "star",
    "unicode": ""
  },
  {
    "font_class": "star-filled",
    "unicode": ""
  },
  {
    "font_class": "starhalf",
    "unicode": ""
  },
  {
    "font_class": "trash",
    "unicode": ""
  },
  {
    "font_class": "trash-filled",
    "unicode": ""
  },
  {
    "font_class": "tune",
    "unicode": ""
  },
  {
    "font_class": "tune-filled",
    "unicode": ""
  },
  {
    "font_class": "undo",
    "unicode": ""
  },
  {
    "font_class": "undo-filled",
    "unicode": ""
  },
  {
    "font_class": "up",
    "unicode": ""
  },
  {
    "font_class": "top",
    "unicode": ""
  },
  {
    "font_class": "upload",
    "unicode": ""
  },
  {
    "font_class": "upload-filled",
    "unicode": ""
  },
  {
    "font_class": "videocam",
    "unicode": ""
  },
  {
    "font_class": "videocam-filled",
    "unicode": ""
  },
  {
    "font_class": "vip",
    "unicode": ""
  },
  {
    "font_class": "vip-filled",
    "unicode": ""
  },
  {
    "font_class": "wallet",
    "unicode": ""
  },
  {
    "font_class": "wallet-filled",
    "unicode": ""
  },
  {
    "font_class": "weibo",
    "unicode": ""
  },
  {
    "font_class": "weixin",
    "unicode": ""
  }
];
const iconUrl = "/assets/uniicons.32e978a5.ttf";
const _style_0$2 = { "uni-icons": { "": { "fontFamily": "uniicons", "textDecoration": "none", "textAlign": "center" } } };
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const getVal = (val) => {
  const reg = /^[0-9]*$/g;
  return typeof val === "number" || reg.test(val) ? val + "px" : val;
};
var domModule = weex.requireModule("dom");
domModule.addRule("fontFace", {
  "fontFamily": "uniicons",
  "src": "url('" + iconUrl + "')"
});
const _sfc_main$2 = {
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
  return openBlock(), createElementBlock(
    "u-text",
    {
      style: normalizeStyle($options.styleObj),
      class: "uni-icons",
      onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
    },
    toDisplayString($options.unicode),
    5
    /* TEXT, STYLE */
  );
}
const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["styles", [_style_0$2]], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
const _style_0$1 = { "you-touchbox": { "": { "position": "fixed", "left": 0, "right": 0 } }, "touchend": { "": { "transitionProperty": "top", "transitionDuration": 1e3 } }, "you-touchbox-content": { "": { "flex": 1, "backgroundColor": "#ffffff" } }, "touch-line-box": { "": { "paddingTop": 5, "paddingRight": 0, "paddingBottom": 10, "paddingLeft": 0, "alignItems": "center" } }, "touch-line": { "": { "width": 45, "height": 5, "borderRadius": 25, "backgroundColor": "rgba(51,51,51,0.2)" } }, "@TRANSITION": { "touchend": { "property": "top", "duration": 1e3 } } };
const _sfc_main$1 = {
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
  return openBlock(), createElementBlock(
    "view",
    {
      class: normalizeClass(["you-touchbox", { touchend: $data.isTouchEnd }]),
      onTouchstart: _cache[1] || (_cache[1] = (...args) => $options.onTouchStart && $options.onTouchStart(...args)),
      onTouchmove: _cache[2] || (_cache[2] = withModifiers((...args) => $options.onTouchmove && $options.onTouchmove(...args), ["stop", "prevent"])),
      onTouchend: _cache[3] || (_cache[3] = (...args) => $options.onTouchend && $options.onTouchend(...args)),
      style: normalizeStyle({ top: $data.top + $data.distance + "px", zIndex: $props.zIndex, height: $data.windowHeight + "px" }),
      renderWhole: true
    },
    [
      createElementVNode(
        "view",
        {
          class: "you-touchbox-content",
          style: normalizeStyle($props.customStyle),
          onClick: _cache[0] || (_cache[0] = withModifiers(() => {
          }, ["stop", "prevent"]))
        },
        [
          createElementVNode("view", { class: "touch-line-box" }, [
            createElementVNode("view", { class: "touch-line" })
          ]),
          renderSlot(_ctx.$slots, "default")
        ],
        4
        /* STYLE */
      )
    ],
    38
    /* CLASS, STYLE, NEED_HYDRATION */
  );
}
const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["styles", [_style_0$1]], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/you-touchbox/components/you-touchbox/you-touchbox.vue"]]);
const _style_0 = { "mao": { "": { "height": "1500rpx", "width": "700rpx", "display": "flex" } }, "search-box": { "": { "backgroundColor": "#f5f5f5", "borderRadius": 30, "paddingTop": 12, "paddingRight": 20, "paddingBottom": 12, "paddingLeft": 20, "display": "flex", "flexDirection": "row", "alignItems": "center", "marginTop": 0, "marginRight": 20, "marginBottom": 20, "marginLeft": 20 } }, "search-input": { "": { "flex": 1, "borderWidth": 0, "borderColor": "#000000", "backgroundColor": "rgba(0,0,0,0)", "fontSize": 16, "outline": "none", "marginLeft": 10 } }, "quick-actions": { "": { "display": "flex", "flexDirection": "row", "justifyContent": "space-around", "paddingTop": 15, "paddingRight": 20, "paddingBottom": 15, "paddingLeft": 20, "borderBottomWidth": 1, "borderBottomStyle": "solid", "borderBottomColor": "#f0f0f0" } }, "action-item": { "": { "display": "flex", "flexDirection": "column", "alignItems": "center" } }, "action-icon": { "": { "width": 60, "height": 60, "borderRadius": 20, "display": "flex", "alignItems": "center", "justifyContent": "center", "marginBottom": 8 } }, "action-text": { "": { "fontSize": 13, "color": "#555555" } } };
const _sfc_main = {
  __name: "funs",
  setup(__props, { expose: __expose }) {
    __expose();
    const myMap = ref();
    const mintop = ref(100);
    const actions = ref([
      { icon: "map", text: "警情", bgColor: "#e6f4ff", color: "#0089ff" },
      { icon: "home", text: "场所", bgColor: "#e6f4ff", color: "#0089ff" },
      { icon: "person", text: "人员", bgColor: "#e6f4ff", color: "#0089ff" },
      { icon: "fire", text: "化矛", bgColor: "#e6f4ff", color: "#0089ff" },
      { icon: "map-pin", text: "待定", bgColor: "#e6f4ff", color: "#0089ff" }
    ]);
    const latitude = ref(0);
    const longitude = ref(0);
    function getLocal() {
      uni.getLocation({
        type: "gcj02",
        isHighAccuracy: true,
        //高精度
        geocode: true,
        //将位置解析成地址
        success: (res) => {
          formatAppLog("log", "at pages/funs/funs.nvue:47", res);
          latitude.value = res.latitude;
          longitude.value = res.longitude;
          formatAppLog("log", "at pages/funs/funs.nvue:50", latitude.value);
        }
      });
    }
    function movedital(e) {
      formatAppLog("log", "at pages/funs/funs.nvue:57", e.curTop);
      if (e.curTop < 300)
        ;
    }
    getLocal();
    const __returned__ = { myMap, mintop, actions, latitude, longitude, getLocal, movedital, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_uni_icons = resolveEasycom(resolveDynamicComponent("uni-icons"), __easycom_0);
  const _component_you_touchbox = resolveEasycom(resolveDynamicComponent("you-touchbox"), __easycom_1);
  return openBlock(), createElementBlock("scroll-view", {
    scrollY: true,
    showScrollbar: true,
    enableBackToTop: true,
    bubble: "true",
    style: { flexDirection: "column" }
  }, [
    createElementVNode("view", { class: "" }, [
      createElementVNode("map", {
        class: "mao",
        showLocation: true,
        latitude: $setup.latitude,
        longitude: $setup.longitude
      }, null, 8, ["latitude", "longitude"]),
      createVNode(_component_you_touchbox, {
        ref: "myMap",
        minTop: $setup.mintop,
        auto: false,
        onGetEndDetail: $setup.movedital,
        customStyle: "border-top-left-radius:50rpx;border-top-right-radius:50rpx"
      }, {
        default: withCtx(() => [
          createElementVNode("view", { class: "search-box" }, [
            createVNode(_component_uni_icons, {
              type: "search",
              size: "18",
              color: "#999"
            }),
            createElementVNode("u-input", {
              class: "search-input",
              type: "text",
              placeholder: "搜索警情、人员、场所"
            })
          ]),
          createElementVNode("view", { class: "quick-actions" }, [
            (openBlock(true), createElementBlock(
              Fragment,
              null,
              renderList($setup.actions, (action, index) => {
                return openBlock(), createElementBlock("view", {
                  class: "action-item",
                  key: index
                }, [
                  createElementVNode(
                    "view",
                    {
                      class: "action-icon",
                      style: normalizeStyle({ backgroundColor: action.bgColor })
                    },
                    [
                      createVNode(_component_uni_icons, {
                        type: action.icon,
                        size: "24",
                        color: action.color
                      }, null, 8, ["type", "color"])
                    ],
                    4
                    /* STYLE */
                  ),
                  createElementVNode(
                    "u-text",
                    { class: "action-text" },
                    toDisplayString(action.text),
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
const funs = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["styles", [_style_0]], ["__file", "D:/Code/Dev/GXA/Client/DevApp/pages/funs/funs.nvue"]]);
export {
  funs as default
};
