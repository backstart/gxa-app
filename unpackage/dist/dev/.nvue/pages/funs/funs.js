import { openBlock, createElementBlock, normalizeStyle, toDisplayString, normalizeClass, withModifiers, createElementVNode, renderSlot, ref, resolveDynamicComponent, createVNode, withCtx, Fragment, renderList, createCommentVNode } from "vue";
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
const _style_0 = { "mao": { "": { "height": "1500rpx", "width": "700rpx", "display": "flex" } }, "search-box": { "": { "backgroundColor": "#f5f5f5", "borderRadius": 30, "paddingTop": 12, "paddingRight": 20, "paddingBottom": 12, "paddingLeft": 20, "display": "flex", "flexDirection": "row", "alignItems": "center", "marginTop": 0, "marginRight": 20, "marginBottom": 20, "marginLeft": 20 } }, "search-input": { "": { "flex": 1, "borderWidth": 0, "borderColor": "#000000", "backgroundColor": "rgba(0,0,0,0)", "fontSize": 16, "outline": "none", "marginLeft": 10 } }, "quick-actions": { "": { "display": "flex", "flexDirection": "row", "justifyContent": "space-around", "paddingTop": 15, "paddingRight": 20, "paddingBottom": 15, "paddingLeft": 20, "borderBottomWidth": 1, "borderBottomStyle": "solid", "borderBottomColor": "#f0f0f0" } }, "action-item": { "": { "display": "flex", "flexDirection": "column", "alignItems": "center" } }, "action-icon": { "": { "width": 60, "height": 60, "borderRadius": 20, "display": "flex", "alignItems": "center", "justifyContent": "center", "marginBottom": 8 } }, "action-text": { "": { "fontSize": 13, "color": "#555555" } }, "listcontent": { "": { "display": "flex", "flexDirection": "column" } }, "mui-content-padded": { "": { "marginTop": 0, "marginRight": 14, "marginBottom": 0, "marginLeft": 14 } }, "btnview": { "": { "position": "fixed", "bottom": 50, "right": 15, "height": 50, "width": 50, "backgroundColor": "#F5F5F5", "justifyContent": "center", "alignItems": "center", "borderRadius": 50, "boxShadow": "0 2px 10px rgba(0, 0, 0, 0.2)" } }, "uni-list-cell": { "": { "flexDirection": "column", "marginTop": 10, "backgroundColor": "#FFFFFF", "paddingTop": 6, "paddingRight": 12, "paddingBottom": 6, "paddingLeft": 12 } }, "topTitleV": { "": { "height": 26, "lineHeight": 26, "color": "#333333", "fontFamily": "PingFangSC-Semibold, PingFang SC", "fontWeight": "500", "fontSize": 14, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" } }, "unitV": { "": { "color": "#555555", "fontSize": 12, "marginTop": 0, "fontFamily": "PingFangSC-Regular, PingFang SC" } }, "cellView": { "": { "marginTop": 8, "marginLeft": 8, "height": 22, "lineHeight": 22, "textAlign": "center", "borderRadius": 2, "!paddingTop": 0, "!paddingRight": 4, "!paddingBottom": 0, "!paddingLeft": 4, "fontSize": 15, "color": "#4272FF", "backgroundColor": "#F3F4F6" } } };
const _sfc_main = {
  __name: "funs",
  setup(__props, { expose: __expose }) {
    __expose();
    const myMap = ref();
    const mintop = ref(300);
    const isTouchDisable = ref(true);
    const hasLaunch = ref(true);
    const btnviewtxt = ref("展开");
    let btnviewbool = false;
    const title = ref("uni-fab");
    const directionStr = ref("垂直");
    const horizontal = ref("right");
    const vertical = ref("bottom");
    const direction = ref("horizontal");
    const pattern = ref({
      color: "#7A7E83",
      backgroundColor: "#fff",
      selectedColor: "#007AFF",
      buttonColor: "#007AFF",
      iconColor: "#fff"
    });
    const is_color_type = ref(false);
    const content = ref([
      {
        iconPath: "https://www.pixsector.com/cache/517d8be6/av5c8336583e291842624.png",
        selectedIconPath: "https://www.pixsector.com/cache/517d8be6/av5c8336583e291842624.png",
        text: "热力图",
        active: false
      },
      {
        iconPath: "/static/home.png",
        selectedIconPath: "/static/home-active.png",
        text: "首页",
        active: false
      },
      {
        iconPath: "/static/star.png",
        selectedIconPath: "/static/star-active.png",
        text: "收藏",
        active: false
      }
    ]);
    function btnviewClick() {
      if (boxstatus) {
        btnviewtxt.value = "展开";
        myMap.value.setBottom(0.4);
      } else {
        btnviewtxt.value = "折叠";
        myMap.value.setBottom(0.8);
      }
      boxstatus = !boxstatus;
    }
    function trigger(e) {
      formatAppLog("log", "at pages/funs/funs.nvue:121", e);
      content.value[e.index].active = !e.item.active;
      uni.showModal({
        title: "提示",
        content: `您${content.value[e.index].active ? "选中了" : "取消了"}${e.item.text}`,
        success: function(res) {
          if (res.confirm) {
            formatAppLog("log", "at pages/funs/funs.nvue:128", "用户点击确定");
          } else if (res.cancel) {
            formatAppLog("log", "at pages/funs/funs.nvue:130", "用户点击取消");
          }
        }
      });
    }
    function fabClick() {
      uni.showToast({
        title: "点击了悬浮按钮",
        icon: "none"
      });
    }
    function goProDetail(item) {
      formatAppLog("log", "at pages/funs/funs.nvue:145", item);
    }
    function bindTag(item) {
      return [item.area, item.proType, item.stage];
    }
    function bindColor(index) {
      let colorArr = ["#4473FF", "#FFA01B", "#41D380"];
      return colorArr[index % 3];
    }
    function bindBgColor(index) {
      let bgColorArr = ["#F1F4FA", "#FFF5E8", "#ECFAF2"];
      return bgColorArr[index % 3];
    }
    const actions = ref([
      {
        icon: "map",
        text: "警情",
        bgColor: "#e6f4ff",
        color: "#0089ff"
      },
      {
        icon: "home",
        text: "场所",
        bgColor: "#e6f4ff",
        color: "#0089ff"
      },
      {
        icon: "person",
        text: "人员",
        bgColor: "#e6f4ff",
        color: "#0089ff"
      },
      {
        icon: "fire",
        text: "处警",
        bgColor: "#e6f4ff",
        color: "#0089ff"
      },
      {
        icon: "map-pin",
        text: "巡防",
        bgColor: "#e6f4ff",
        color: "#0089ff"
      }
    ]);
    const latitude = ref(0);
    const projectList = ref({});
    const longitude = ref(0);
    const totalNum = ref(0);
    const curPageNum = ref(1);
    let boxstatus = false;
    function getLocal() {
      uni.getLocation({
        type: "gcj02",
        isHighAccuracy: true,
        //高精度
        geocode: true,
        //将位置解析成地址
        success: (res) => {
          formatAppLog("log", "at pages/funs/funs.nvue:209", res);
          latitude.value = res.latitude;
          longitude.value = res.longitude;
        }
      });
    }
    function changbox(e) {
      getDate(e);
    }
    function movedital(e) {
      formatAppLog("log", "at pages/funs/funs.nvue:225", e.curTop);
      if (e.curTop < 300)
        ;
    }
    function pageClick(tag) {
      if (tag === 0) {
        if (curPageNum.value > 1) {
          curPageNum.value--;
          requestData();
        }
      } else {
        if (totalNum.value > curPageNum.value * 10) {
          curPageNum.value++;
          requestData();
        }
      }
    }
    function getDate(index) {
      projectList.value = [];
      totalNum.value = 15;
      for (let i = 1; i < 2; i++) {
        if (index === 0) {
          projectList.value.push({
            "proName": "警情一",
            "proUnit": "长命水市场买菜纠纷",
            "area": "纠纷类",
            "proType": "未指派",
            "stage": "未反馈",
            "id": i + ""
          });
        } else if (index === 1) {
          projectList.value.push({
            "proName": "龙井坊KTV",
            "proUnit": "长命水大街3号",
            "area": "娱乐场所",
            "proType": "高风险",
            "stage": "未检查",
            "id": i + ""
          });
        } else if (index === 2) {
          projectList.value.push({
            "proName": "张三",
            "proUnit": "住址：龙石大山脚45号",
            "area": "吸毒",
            "proType": "未走访",
            "stage": "高风险",
            "id": i + ""
          });
        } else if (index === 3) {
          projectList.value.push({
            "proName": "警情一",
            "proUnit": "长命水市场买菜纠纷  处警人：张三",
            "area": "纠纷类",
            "proType": "已指派",
            "stage": "未反馈",
            "id": i + ""
          });
        } else if (index === 4) {
          projectList.value.push({
            "proName": "长坑水库",
            "proUnit": "桂南巡区到长坑水库进行安全检查",
            "area": "桂南",
            "proType": "安全检查",
            "stage": "日常",
            "id": i + ""
          });
        }
      }
    }
    getLocal();
    getDate(0);
    const __returned__ = { myMap, mintop, isTouchDisable, hasLaunch, btnviewtxt, get btnviewbool() {
      return btnviewbool;
    }, set btnviewbool(v) {
      btnviewbool = v;
    }, title, directionStr, horizontal, vertical, direction, pattern, is_color_type, content, btnviewClick, trigger, fabClick, goProDetail, bindTag, bindColor, bindBgColor, actions, latitude, projectList, longitude, totalNum, curPageNum, get boxstatus() {
      return boxstatus;
    }, set boxstatus(v) {
      boxstatus = v;
    }, getLocal, changbox, movedital, pageClick, getDate, ref };
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
    createElementVNode("view", { class: "con" }, [
      createElementVNode("map", {
        class: "mao",
        showLocation: true,
        latitude: $setup.latitude,
        longitude: $setup.longitude
      }, null, 8, ["latitude", "longitude"]),
      createVNode(_component_you_touchbox, {
        ref: "myMap",
        disable: $setup.isTouchDisable,
        minTop: $setup.mintop,
        auto: true,
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
                  key: index,
                  onClick: ($event) => $setup.changbox(index)
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
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          createElementVNode("scroll-view", {
            scrollY: "true",
            class: "listcontent"
          }, [
            (openBlock(true), createElementBlock(
              Fragment,
              null,
              renderList($setup.projectList, (item, index) => {
                return openBlock(), createElementBlock("view", {
                  class: "uni-list-cell",
                  hoverClass: "uni-list-cell-hover",
                  key: item.id,
                  onClick: ($event) => $setup.goProDetail(item)
                }, [
                  createElementVNode(
                    "u-text",
                    { class: "topTitleV" },
                    toDisplayString(item.proName),
                    1
                    /* TEXT */
                  ),
                  createElementVNode(
                    "u-text",
                    { class: "topTitleV unitV" },
                    toDisplayString(item.proUnit),
                    1
                    /* TEXT */
                  ),
                  createElementVNode("view", { style: { "display": "flex", "flex": "1", "flex-wrap": "wrap", "margin-top": "0px", "margin-left": "-8px", "height": "38px", "width": "calc(100vw-62px)" } }, [
                    createCommentVNode(" 自定义了一个data-id的属性,可以通过js获取到它的值!  hover-class 指定按下去的样式类"),
                    (openBlock(true), createElementBlock(
                      Fragment,
                      null,
                      renderList($setup.bindTag(item), (tagItem, index2) => {
                        return openBlock(), createElementBlock(
                          "u-text",
                          {
                            class: "cellView",
                            style: normalizeStyle({ color: $setup.bindColor(index2), backgroundColor: $setup.bindBgColor(index2) }),
                            key: index2
                          },
                          toDisplayString(tagItem),
                          5
                          /* TEXT, STYLE */
                        );
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["disable", "minTop"]),
      createElementVNode("view", {
        class: "btnview",
        onClick: $setup.btnviewClick
      }, [
        createElementVNode(
          "u-text",
          null,
          toDisplayString($setup.btnviewtxt),
          1
          /* TEXT */
        )
      ])
    ])
  ]);
}
const funs = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["styles", [_style_0]], ["__file", "D:/Code/Dev/GXA/Client/DevApp/pages/funs/funs.nvue"]]);
export {
  funs as default
};
