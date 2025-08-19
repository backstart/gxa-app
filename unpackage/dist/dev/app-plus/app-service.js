if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
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
  const svpProps = {
    src: {
      type: String,
      default: ""
    },
    color: {
      type: String,
      default: ""
    },
    web: {
      type: Boolean,
      default: false
    },
    inherit: {
      type: Boolean,
      default: false
    }
  };
  function svgToDataUrl(svgString) {
    const encodedSvg = encodeURIComponent(svgString).replace(/\+/g, "%20");
    return `data:image/svg+xml,${encodedSvg}`;
  }
  const _sfc_main$8 = vue.defineComponent({
    // name: 'l-svg',
    props: svpProps,
    emits: ["load", "error", "click"],
    setup(props, { emit }) {
      const path = vue.ref("");
      const isInherit = vue.computed(() => {
        return props.color != "";
      });
      const formatUrl = (url, action) => {
        if (url.indexOf(`'`) > 0)
          return `${action}("${url}")`;
        return `${action}('${url}')`;
      };
      vue.getCurrentInstance().proxy;
      const imageURL = vue.ref(null);
      const styles = vue.computed(() => {
        const style = {};
        if (path.value != "") {
          const image2 = formatUrl(imageURL.value || path.value, "url");
          if (isInherit.value) {
            style["-webkit-mask-image"] = image2;
            style["mask-image"] = image2;
          } else {
            style["background-image"] = image2;
          }
        }
        if (props.color != "") {
          style["color"] = props.color;
        }
        return style;
      });
      const onLoad = (e) => {
        emit("load");
      };
      const onError = () => {
        emit("error");
      };
      vue.watchEffect(() => {
        if (props.src == "")
          return;
        if (props.src.startsWith("<svg")) {
          path.value = svgToDataUrl(props.src);
        } else if (props.src.startsWith("/static")) {
          path.value = props.src.slice(1);
        } else {
          path.value = props.src;
        }
      });
      return {
        path,
        onLoad,
        onError,
        isInherit,
        styles
      };
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key2, val] of props) {
      target[key2] = val;
    }
    return target;
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["l-svg", { "is-inherit": _ctx.isInherit }]),
        style: vue.normalizeStyle([_ctx.styles]),
        onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("click"))
      },
      [
        vue.createElementVNode("image", {
          class: "l-svg-img",
          src: _ctx.path,
          onLoad: _cache[0] || (_cache[0] = (...args) => _ctx.onLoad && _ctx.onLoad(...args)),
          onError: _cache[1] || (_cache[1] = (...args) => _ctx.onError && _ctx.onError(...args))
        }, null, 40, ["src"])
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_0$2 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__scopeId", "data-v-82df574c"], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/lime-svg/components/l-svg/l-svg.vue"]]);
  const accessibility = "";
  const activity = "";
  const add = "";
  const adjustment = "";
  const alarm = "";
  const alpha = "";
  const analytics = "";
  const anchor = "";
  const angry = "";
  const animation = "";
  const anticlockwise = "";
  const api = "";
  const app = "";
  const apple = "";
  const application = "";
  const archway = "";
  const artboard = "";
  const article = "";
  const assignment = "";
  const attach = "";
  const attic = "";
  const audio = "";
  const awkward = "";
  const backtop = "";
  const backup = "";
  const backward = "";
  const banana = "";
  const barbecue = "";
  const barcode = "";
  const battery = "";
  const bean = "";
  const beer = "";
  const beta = "";
  const bifurcate = "";
  const bill = "";
  const bluetooth = "";
  const bone = "";
  const book = "";
  const bookmark = "";
  const braces = "";
  const brackets = "";
  const bread = "";
  const bridge = "";
  const brightness = "";
  const broccoli = "";
  const browse = "";
  const brush = "";
  const bug = "";
  const building = "";
  const bulletpoint = "";
  const button = "";
  const cabbage = "";
  const cake = "";
  const calculation = "";
  const calculator = "";
  const calendar = "";
  const call = "";
  const calm = "";
  const camera = "";
  const candy = "";
  const card = "";
  const cardmembership = "";
  const cart = "";
  const cast = "";
  const castle = "";
  const cat = "";
  const catalog = "";
  const cd = "";
  const celsius = "";
  const centimeter = "";
  const certificate = "";
  const chart = "";
  const chat = "";
  const check = "";
  const cheese = "";
  const cherry = "";
  const chicken = "";
  const chili = "";
  const chimney = "";
  const church = "";
  const circle = "";
  const city = "";
  const clear = "";
  const close = "";
  const cloud = "";
  const code = "";
  const cola = "";
  const collage = "";
  const collection = "";
  const combination = "";
  const command = "";
  const compass = "";
  const constraint = "";
  const contrast = "";
  const cooperate = "";
  const copy = "";
  const copyright = "";
  const corn = "";
  const coupon = "";
  const course = "";
  const cpu = "";
  const crack = "";
  const creditcard = "";
  const css3 = "";
  const cucumber = "";
  const cursor = "";
  const curtain = "";
  const curve = "";
  const cut = "";
  const dam = "";
  const dashboard = "";
  const data = "";
  const delta = "";
  const depressed = "";
  const desktop = "";
  const despise = "";
  const device = "";
  const discount = "";
  const dissatisfaction = "";
  const divide = "";
  const dividers = "";
  const doge = "";
  const download = "";
  const downscale = "";
  const drink = "";
  const drumstick = "";
  const dv = "";
  const dvd = "";
  const earphone = "";
  const earth = "";
  const edit = "";
  const education = "";
  const eggplant = "";
  const ellipsis = "";
  const enter = "";
  const equal = "";
  const error = "";
  const excited = "";
  const explore = "";
  const exposure = "";
  const extension = "";
  const ferocious = "";
  const file = "";
  const film = "";
  const filter = "";
  const fingerprint = "";
  const fish = "";
  const flag = "";
  const flashlight = "";
  const focus = "";
  const fog = "";
  const folder = "";
  const forest = "";
  const fork = "";
  const form = "";
  const forward = "";
  const frame = "";
  const fries = "";
  const fullscreen = "";
  const functions = "";
  const gamepad = "";
  const gamma = "";
  const garlic = "";
  const gift = "";
  const giggle = "";
  const gps = "";
  const grape = "";
  const guitar = "";
  const hamburger = "";
  const happy = "";
  const hashtag = "";
  const hd = "";
  const heart = "";
  const help = "";
  const highlight = "";
  const history = "";
  const home = "";
  const horizontal = "";
  const hospital = "";
  const hourglass = "";
  const houses = "";
  const html5 = "";
  const https = "";
  const icon = "";
  const image = "";
  const indicator = "";
  const ink = "";
  const install = "";
  const institution = "";
  const internet = "";
  const ipod = "";
  const joyful = "";
  const jump = "";
  const key = "";
  const keyboard = "";
  const laptop = "";
  const layers = "";
  const layout = "";
  const leaderboard = "";
  const lemon = "";
  const lightbulb = "";
  const lighthouse = "";
  const link = "";
  const liquor = "";
  const list = "";
  const load = "";
  const loading = "";
  const location = "";
  const login = "";
  const logout = "";
  const loudspeaker = "";
  const mail = "";
  const map = "";
  const markup = "";
  const mathematics = "";
  const measurement = "";
  const member = "";
  const menu = "";
  const microphone = "";
  const milk = "";
  const minus = "";
  const mirror = "";
  const mobile = "";
  const module = "";
  const money = "";
  const monument = "";
  const moon = "";
  const more = "";
  const mosque = "";
  const mouse = "";
  const move = "";
  const multiply = "";
  const museum = "";
  const mushroom = "";
  const music = "";
  const next = "";
  const noodle = "";
  const notification = "";
  const nut = "";
  const opera = "";
  const outbox = "";
  const palace = "";
  const palette = "";
  const pantone = "";
  const parabola = "";
  const parentheses = "";
  const paste = "";
  const patio = "";
  const pause = "";
  const pea = "";
  const peach = "";
  const pear = "";
  const pen = "";
  const pending = "";
  const percent = "";
  const pi = "";
  const piano = "";
  const pin = "";
  const play = "";
  const plus2 = "";
  const popsicle = "";
  const portrait = "";
  const pout = "";
  const poweroff = "";
  const previous = "";
  const print = "";
  const pumpkin = "";
  const pyramid = "";
  const qrcode = "";
  const quadratic = "";
  const questionnaire = "";
  const queue = "";
  const radar = "";
  const radish = "";
  const rainbow = "";
  const rectangle = "";
  const refresh = "";
  const relation = "";
  const relativity = "";
  const remove = "";
  const replay = "";
  const rice = "";
  const roast = "";
  const rocket = "";
  const rollback = "";
  const rollfront = "";
  const rotate = "";
  const rotation = "";
  const round = "";
  const rss = "";
  const ruler = "";
  const sandwich = "";
  const saturation = "";
  const sausage = "";
  const save = "";
  const scan = "";
  const screencast = "";
  const screenshot = "";
  const search = "";
  const secured = "";
  const send = "";
  const sensors = "";
  const sequence = "";
  const serenity = "";
  const server = "";
  const service = "";
  const setting = "";
  const share = "";
  const sharpness = "";
  const shimen = "";
  const shop = "";
  const shrimp = "";
  const shutter = "";
  const shutup = "";
  const sip = "";
  const sitemap = "";
  const slash = "";
  const sleep = "";
  const slice = "";
  const slideshow = "";
  const smile = "";
  const sneer = "";
  const snowflake = "";
  const sonic = "";
  const sound = "";
  const space = "";
  const speechless = "";
  const star = "";
  const stop = "";
  const store = "";
  const subtitle = "";
  const sum = "";
  const sunny = "";
  const support = "";
  const surprised = "";
  const swap = "";
  const tab = "";
  const table = "";
  const tag = "";
  const tangerinr = "";
  const tape = "";
  const task = "";
  const tea = "";
  const teahouse = "";
  const template = "";
  const temple = "";
  const terminal = "";
  const textbox = "";
  const theaters = "";
  const thunder = "";
  const thunderstorm = "";
  const ticket = "";
  const time = "";
  const tips = "";
  const tomato = "";
  const tools = "";
  const tornado = "";
  const tower = "";
  const town = "";
  const traffic = "";
  const transform = "";
  const translate = "";
  const tv = "";
  const typography = "";
  const uncomfortable = "";
  const undertake = "";
  const unhappy = "";
  const uninstall = "";
  const upload = "";
  const upscale = "";
  const usb = "";
  const user = "";
  const usercase = "";
  const usergroup = "";
  const vehicle = "";
  const verified = "";
  const verify = "";
  const vertical = "";
  const video = "";
  const wallet = "";
  const watch = "";
  const watermelon = "";
  const wealth = "";
  const widget = "";
  const wifi = "";
  const window = "";
  const windy = "";
  const wink = "";
  const work = "";
  const icons = {
    "accessibility-filled": "",
    accessibility,
    "activity-filled": "",
    activity,
    "add-and-subtract": "",
    "add-circle-filled": "",
    "add-circle": "",
    "add-rectangle-filled": "",
    "add-rectangle": "",
    add,
    "address-book-filled": "",
    "address-book": "",
    "adjustment-filled": "",
    adjustment,
    "airplay-wave-filled": "",
    "airplay-wave": "",
    "alarm-add-filled": "",
    "alarm-add": "",
    "alarm-filled": "",
    "alarm-off-filled": "",
    "alarm-off": "",
    alarm,
    "align-top": "",
    "align-vertical": "",
    alpha,
    "analytics-filled": "",
    analytics,
    anchor,
    "angry-filled": "",
    angry,
    "animation-1-filled": "",
    "animation-1": "",
    "animation-filled": "",
    animation,
    "anticlockwise-filled": "",
    anticlockwise,
    api,
    "app-filled": "",
    app,
    "apple-filled": "",
    apple,
    "application-filled": "",
    application,
    "architecture-hui-style-filled": "",
    "architecture-hui-style": "",
    "archway-1-filled": "",
    "archway-1": "",
    "archway-filled": "",
    archway,
    "arrow-down-circle-filled": "",
    "arrow-down-circle": "",
    "arrow-down-rectangle-filled": "",
    "arrow-down-rectangle": "",
    "arrow-down": "",
    "arrow-left-circle-filled": "",
    "arrow-left-circle": "",
    "arrow-left-down-circle-filled": "",
    "arrow-left-down-circle": "",
    "arrow-left-down": "",
    "arrow-left-right-1": "",
    "arrow-left-right-2": "",
    "arrow-left-right-3": "",
    "arrow-left-right-circle-filled": "",
    "arrow-left-right-circle": "",
    "arrow-left-up-circle-filled": "",
    "arrow-left-up-circle": "",
    "arrow-left-up": "",
    "arrow-left": "",
    "arrow-right-circle-filled": "",
    "arrow-right-circle": "",
    "arrow-right-down-circle-filled": "",
    "arrow-right-down-circle": "",
    "arrow-right-down": "",
    "arrow-right-up-circle-filled": "",
    "arrow-right-up-circle": "",
    "arrow-right-up": "",
    "arrow-right": "",
    "arrow-triangle-down-filled": "",
    "arrow-triangle-down": "",
    "arrow-triangle-up-filled": "",
    "arrow-triangle-up": "",
    "arrow-up-circle-filled": "",
    "arrow-up-circle": "",
    "arrow-up-down-1": "",
    "arrow-up-down-2": "",
    "arrow-up-down-3": "",
    "arrow-up-down-circle-filled": "",
    "arrow-up-down-circle": "",
    "arrow-up": "",
    artboard,
    "article-filled": "",
    article,
    "assignment-checked-filled": "",
    "assignment-checked": "",
    "assignment-code-filled": "",
    "assignment-code": "",
    "assignment-error-filled": "",
    "assignment-error": "",
    "assignment-filled": "",
    "assignment-user-filled": "",
    "assignment-user": "",
    assignment,
    attach,
    "attic-1-filled": "",
    "attic-1": "",
    "attic-filled": "",
    attic,
    "audio-filled": "",
    audio,
    "awkward-filled": "",
    awkward,
    "backtop-rectangle-filled": "",
    "backtop-rectangle": "",
    backtop,
    "backup-filled": "",
    backup,
    "backward-filled": "",
    backward,
    "bad-laugh-filled": "",
    "bad-laugh": "",
    "bamboo-shoot-filled": "",
    "bamboo-shoot": "",
    "banana-filled": "",
    banana,
    "barbecue-filled": "",
    barbecue,
    "barcode-1": "",
    barcode,
    "base-station": "",
    "battery-add-filled": "",
    "battery-add": "",
    "battery-charging-filled": "",
    "battery-charging": "",
    "battery-filled": "",
    "battery-low-filled": "",
    "battery-low": "",
    battery,
    "bean-filled": "",
    bean,
    "beer-filled": "",
    beer,
    beta,
    "bifurcate-filled": "",
    bifurcate,
    "bill-filled": "",
    bill,
    bluetooth,
    "bone-filled": "",
    bone,
    "book-filled": "",
    "book-open-filled": "",
    "book-open": "",
    "book-unknown-filled": "",
    "book-unknown": "",
    book,
    "bookmark-add-filled": "",
    "bookmark-add": "",
    "bookmark-checked-filled": "",
    "bookmark-checked": "",
    "bookmark-double-filled": "",
    "bookmark-double": "",
    "bookmark-filled": "",
    "bookmark-minus-filled": "",
    "bookmark-minus": "",
    bookmark,
    braces,
    brackets,
    "bread-filled": "",
    bread,
    "bridge-1-filled": "",
    "bridge-1": "",
    "bridge-2-filled": "",
    "bridge-2": "",
    "bridge-3": "",
    "bridge-4": "",
    "bridge-5-filled": "",
    "bridge-5": "",
    "bridge-6-filled": "",
    "bridge-6": "",
    bridge,
    "brightness-1-filled": "",
    "brightness-1": "",
    "brightness-filled": "",
    brightness,
    "broccoli-filled": "",
    broccoli,
    "browse-filled": "",
    "browse-gallery-filled": "",
    "browse-gallery": "",
    "browse-off-filled": "",
    "browse-off": "",
    browse,
    "brush-filled": "",
    brush,
    "bug-filled": "",
    "bug-report-filled": "",
    "bug-report": "",
    bug,
    "building-1-filled": "",
    "building-1": "",
    "building-2-filled": "",
    "building-2": "",
    "building-3-filled": "",
    "building-3": "",
    "building-4-filled": "",
    "building-4": "",
    "building-5-filled": "",
    "building-5": "",
    "building-filled": "",
    building,
    bulletpoint,
    "button-filled": "",
    button,
    "cabbage-filled": "",
    cabbage,
    "cake-filled": "",
    cake,
    "calculation-1-filled": "",
    "calculation-1": "",
    calculation,
    "calculator-1": "",
    "calculator-filled": "",
    calculator,
    "calendar-1-filled": "",
    "calendar-1": "",
    "calendar-2-filled": "",
    "calendar-2": "",
    "calendar-edit-filled": "",
    "calendar-edit": "",
    "calendar-event-filled": "",
    "calendar-event": "",
    "calendar-filled": "",
    calendar,
    "call-1-filled": "",
    "call-1": "",
    "call-cancel-filled": "",
    "call-cancel": "",
    "call-filled": "",
    "call-forwarded-filled": "",
    "call-forwarded": "",
    "call-incoming-filled": "",
    "call-incoming": "",
    "call-off-filled": "",
    "call-off": "",
    call,
    "calm-1-filled": "",
    "calm-1": "",
    "calm-filled": "",
    calm,
    "camera-1-filled": "",
    "camera-1": "",
    "camera-2-filled": "",
    "camera-2": "",
    "camera-filled": "",
    "camera-off-filled": "",
    "camera-off": "",
    camera,
    "candy-filled": "",
    candy,
    "card-filled": "",
    card,
    "cardmembership-filled": "",
    cardmembership,
    "caret-down-small": "",
    "caret-down": "",
    "caret-left-small": "",
    "caret-left": "",
    "caret-right-small": "",
    "caret-right": "",
    "caret-up-small": "",
    "caret-up": "",
    "cart-add-filled": "",
    "cart-add": "",
    "cart-filled": "",
    cart,
    "cast-filled": "",
    cast,
    "castle-1-filled": "",
    "castle-1": "",
    "castle-2-filled": "",
    "castle-2": "",
    "castle-3-filled": "",
    "castle-3": "",
    "castle-4-filled": "",
    "castle-4": "",
    "castle-5-filled": "",
    "castle-5": "",
    "castle-6-filled": "",
    "castle-6": "",
    "castle-7-filled": "",
    "castle-7": "",
    "castle-filled": "",
    castle,
    "cat-filled": "",
    cat,
    "catalog-filled": "",
    catalog,
    "cd-filled": "",
    cd,
    celsius,
    "center-focus-strong-filled": "",
    "center-focus-strong": "",
    centimeter,
    "certificate-1-filled": "",
    "certificate-1": "",
    "certificate-filled": "",
    certificate,
    "chart-3d-filled": "",
    "chart-3d": "",
    "chart-add-filled": "",
    "chart-add": "",
    "chart-analytics": "",
    "chart-area-filled": "",
    "chart-area-multi-filled": "",
    "chart-area-multi": "",
    "chart-area": "",
    "chart-bar-filled": "",
    "chart-bar": "",
    "chart-bubble-filled": "",
    "chart-bubble": "",
    "chart-column-filled": "",
    "chart-column": "",
    "chart-combo-filled": "",
    "chart-combo": "",
    "chart-filled": "",
    "chart-line-data-1": "",
    "chart-line-data": "",
    "chart-line-multi": "",
    "chart-line": "",
    "chart-maximum": "",
    "chart-median": "",
    "chart-minimum": "",
    "chart-pie-filled": "",
    "chart-pie": "",
    "chart-radar-filled": "",
    "chart-radar": "",
    "chart-radial": "",
    "chart-ring-1-filled": "",
    "chart-ring-1": "",
    "chart-ring-filled": "",
    "chart-ring": "",
    "chart-scatter": "",
    "chart-stacked-filled": "",
    "chart-stacked": "",
    chart,
    "chat-add-filled": "",
    "chat-add": "",
    "chat-bubble-1-filled": "",
    "chat-bubble-1": "",
    "chat-bubble-add-filled": "",
    "chat-bubble-add": "",
    "chat-bubble-error-filled": "",
    "chat-bubble-error": "",
    "chat-bubble-filled": "",
    "chat-bubble-help-filled": "",
    "chat-bubble-help": "",
    "chat-bubble-history-filled": "",
    "chat-bubble-history": "",
    "chat-bubble-locked-filled": "",
    "chat-bubble-locked": "",
    "chat-bubble-smile-filled": "",
    "chat-bubble-smile": "",
    "chat-bubble": "",
    "chat-checked-filled": "",
    "chat-checked": "",
    "chat-clear-filled": "",
    "chat-clear": "",
    "chat-double-filled": "",
    "chat-double": "",
    "chat-error-filled": "",
    "chat-error": "",
    "chat-filled": "",
    "chat-heart-filled": "",
    "chat-heart": "",
    "chat-message-filled": "",
    "chat-message": "",
    "chat-off-filled": "",
    "chat-off": "",
    "chat-poll-filled": "",
    "chat-poll": "",
    "chat-setting-filled": "",
    "chat-setting": "",
    chat,
    "check-circle-filled": "",
    "check-circle": "",
    "check-double": "",
    "check-rectangle-filled": "",
    "check-rectangle": "",
    check,
    "cheese-filled": "",
    cheese,
    "cherry-filled": "",
    cherry,
    "chevron-down-circle-filled": "",
    "chevron-down-circle": "",
    "chevron-down-double-s": "",
    "chevron-down-double": "",
    "chevron-down-rectangle-filled": "",
    "chevron-down-rectangle": "",
    "chevron-down-s": "",
    "chevron-down": "",
    "chevron-left-circle-filled": "",
    "chevron-left-circle": "",
    "chevron-left-double-s": "",
    "chevron-left-double": "",
    "chevron-left-rectangle-filled": "",
    "chevron-left-rectangle": "",
    "chevron-left-s": "",
    "chevron-left": "",
    "chevron-right-circle-filled": "",
    "chevron-right-circle": "",
    "chevron-right-double-s": "",
    "chevron-right-double": "",
    "chevron-right-rectangle-filled": "",
    "chevron-right-rectangle": "",
    "chevron-right-s": "",
    "chevron-right": "",
    "chevron-up-circle-filled": "",
    "chevron-up-circle": "",
    "chevron-up-double-s": "",
    "chevron-up-double": "",
    "chevron-up-rectangle-filled": "",
    "chevron-up-rectangle": "",
    "chevron-up-s": "",
    "chevron-up": "",
    chicken,
    "chili-filled": "",
    chili,
    "chimney-1-filled": "",
    "chimney-1": "",
    "chimney-2-filled": "",
    "chimney-2": "",
    "chimney-filled": "",
    chimney,
    "chinese-cabbage-filled": "",
    "chinese-cabbage": "",
    "church-filled": "",
    church,
    "circle-filled": "",
    circle,
    "city-1-filled": "",
    "city-1": "",
    "city-10-filled": "",
    "city-10": "",
    "city-11-filled": "",
    "city-11": "",
    "city-12-filled": "",
    "city-12": "",
    "city-13-filled": "",
    "city-13": "",
    "city-14-filled": "",
    "city-14": "",
    "city-15-filled": "",
    "city-15": "",
    "city-2-filled": "",
    "city-2": "",
    "city-3-filled": "",
    "city-3": "",
    "city-4-filled": "",
    "city-4": "",
    "city-5-filled": "",
    "city-5": "",
    "city-6-filled": "",
    "city-6": "",
    "city-7-filled": "",
    "city-7": "",
    "city-8-filled": "",
    "city-8": "",
    "city-9-filled": "",
    "city-9": "",
    "city-ancient-1-filled": "",
    "city-ancient-1": "",
    "city-ancient-2-filled": "",
    "city-ancient-2": "",
    "city-ancient-filled": "",
    "city-ancient": "",
    "city-filled": "",
    city,
    "clear-filled": "",
    "clear-formatting-1-filled": "",
    "clear-formatting-1": "",
    "clear-formatting-filled": "",
    "clear-formatting": "",
    clear,
    "close-circle-filled": "",
    "close-circle": "",
    "close-octagon-filled": "",
    "close-octagon": "",
    "close-rectangle-filled": "",
    "close-rectangle": "",
    close,
    "cloud-download": "",
    "cloud-filled": "",
    "cloud-upload": "",
    cloud,
    "cloudy-day-filled": "",
    "cloudy-day": "",
    "cloudy-night-filled": "",
    "cloudy-night-rain-filled": "",
    "cloudy-night-rain": "",
    "cloudy-night": "",
    "cloudy-rain-filled": "",
    "cloudy-rain": "",
    "cloudy-sunny-filled": "",
    "cloudy-sunny": "",
    "code-1": "",
    "code-off": "",
    code,
    "cola-filled": "",
    cola,
    "collage-filled": "",
    collage,
    "collection-filled": "",
    collection,
    "color-invert-filled": "",
    "color-invert": "",
    "combination-filled": "",
    combination,
    command,
    "compass-1-filled": "",
    "compass-1": "",
    "compass-filled": "",
    compass,
    "component-breadcrumb-filled": "",
    "component-breadcrumb": "",
    "component-checkbox-filled": "",
    "component-checkbox": "",
    "component-divider-horizontal-filled": "",
    "component-divider-horizontal": "",
    "component-divider-vertical-filled": "",
    "component-divider-vertical": "",
    "component-dropdown-filled": "",
    "component-dropdown": "",
    "component-grid-filled": "",
    "component-grid": "",
    "component-input-filled": "",
    "component-input": "",
    "component-layout-filled": "",
    "component-layout": "",
    "component-radio": "",
    "component-space-filled": "",
    "component-space": "",
    "component-steps-filled": "",
    "component-steps": "",
    "component-switch-filled": "",
    "component-switch": "",
    constraint,
    "contrast-1-filled": "",
    "contrast-1": "",
    "contrast-filled": "",
    contrast,
    "control-platform-filled": "",
    "control-platform": "",
    "cooperate-filled": "",
    cooperate,
    "coordinate-system-filled": "",
    "coordinate-system": "",
    "copy-filled": "",
    copy,
    "copyright-filled": "",
    copyright,
    "corn-filled": "",
    corn,
    "coupon-filled": "",
    coupon,
    "course-filled": "",
    course,
    "cpu-filled": "",
    cpu,
    "crack-filled": "",
    crack,
    "creditcard-add-filled": "",
    "creditcard-add": "",
    "creditcard-filled": "",
    "creditcard-off-filled": "",
    "creditcard-off": "",
    creditcard,
    "crooked-smile-filled": "",
    "crooked-smile": "",
    "cry-and-laugh-filled": "",
    "cry-and-laugh": "",
    "cry-loudly-filled": "",
    "cry-loudly": "",
    "css3-filled": "",
    css3,
    cucumber,
    "currency-exchange": "",
    "cursor-filled": "",
    cursor,
    "curtain-filled": "",
    curtain,
    curve,
    "cut-1": "",
    cut,
    "dam-1-filled": "",
    "dam-1": "",
    "dam-2-filled": "",
    "dam-2": "",
    "dam-3-filled": "",
    "dam-3": "",
    "dam-4-filled": "",
    "dam-4": "",
    "dam-5-filled": "",
    "dam-5": "",
    "dam-6-filled": "",
    "dam-6": "",
    "dam-7-filled": "",
    "dam-7": "",
    "dam-filled": "",
    dam,
    "dart-board-filled": "",
    "dart-board": "",
    "dashboard-1-filled": "",
    "dashboard-1": "",
    "dashboard-filled": "",
    dashboard,
    "data-filled": "",
    "data-base-filled": "",
    "data-base": "",
    "data-checked-filled": "",
    "data-checked": "",
    "data-display": "",
    "data-error-filled": "",
    "data-error": "",
    "data-search-filled": "",
    "data-search": "",
    data,
    "delete-1-filled": "",
    "delete-1": "",
    "delete-filled": "",
    "delete-time-filled": "",
    "delete-time": "",
    "delete": "",
    "delta-filled": "",
    delta,
    "depressed-filled": "",
    depressed,
    "desktop-1-filled": "",
    "desktop-1": "",
    "desktop-filled": "",
    desktop,
    "despise-filled": "",
    despise,
    "device-filled": "",
    device,
    "discount-filled": "",
    discount,
    "dissatisfaction-filled": "",
    dissatisfaction,
    divide,
    "dividers-1": "",
    dividers,
    "doge-filled": "",
    doge,
    "double-storey-filled": "",
    "double-storey": "",
    "download-1": "",
    "download-2-filled": "",
    "download-2": "",
    download,
    downscale,
    "drag-drop": "",
    "drag-move": "",
    "drink-filled": "",
    drink,
    "drumstick-filled": "",
    drumstick,
    "dv-filled": "",
    dv,
    "dvd-filled": "",
    dvd,
    "earphone-filled": "",
    earphone,
    "earth-filled": "",
    earth,
    "edit-1-filled": "",
    "edit-1": "",
    "edit-2-filled": "",
    "edit-2": "",
    "edit-filled": "",
    "edit-off-filled": "",
    "edit-off": "",
    edit,
    "education-filled": "",
    education,
    "eggplant-filled": "",
    eggplant,
    ellipsis,
    "emo-emotional-filled": "",
    "emo-emotional": "",
    enter,
    equal,
    "error-circle-filled": "",
    "error-circle": "",
    "error-triangle-filled": "",
    "error-triangle": "",
    error,
    "excited-1-filled": "",
    "excited-1": "",
    "excited-filled": "",
    excited,
    "expand-down-filled": "",
    "expand-down": "",
    "expand-horizontal": "",
    "expand-up-filled": "",
    "expand-up": "",
    "expand-vertical": "",
    "explore-filled": "",
    "explore-off-filled": "",
    "explore-off": "",
    explore,
    "exposure-filled": "",
    exposure,
    "extension-filled": "",
    "extension-off-filled": "",
    "extension-off": "",
    extension,
    "face-retouching-filled": "",
    "face-retouching": "",
    "fact-check-filled": "",
    "fact-check": "",
    "fahrenheit-scale": "",
    "feel-at-ease-filled": "",
    "feel-at-ease": "",
    "ferocious-filled": "",
    ferocious,
    "ferris-wheel-filled": "",
    "ferris-wheel": "",
    "file-1-filled": "",
    "file-1": "",
    "file-add-1-filled": "",
    "file-add-1": "",
    "file-add-filled": "",
    "file-add": "",
    "file-attachment-filled": "",
    "file-attachment": "",
    "file-blocked-filled": "",
    "file-blocked": "",
    "file-code-1-filled": "",
    "file-code-1": "",
    "file-code-filled": "",
    "file-code": "",
    "file-copy-filled": "",
    "file-copy": "",
    "file-download-filled": "",
    "file-download": "",
    "file-excel-filled": "",
    "file-excel": "",
    "file-export-filled": "",
    "file-export": "",
    "file-filled": "",
    "file-icon-filled": "",
    "file-icon": "",
    "file-image-filled": "",
    "file-image": "",
    "file-import-filled": "",
    "file-import": "",
    "file-locked-filled": "",
    "file-locked": "",
    "file-minus-filled": "",
    "file-minus": "",
    "file-music-filled": "",
    "file-music": "",
    "file-onenote-filled": "",
    "file-onenote": "",
    "file-outlook-filled": "",
    "file-outlook": "",
    "file-paste-filled": "",
    "file-paste": "",
    "file-pdf-filled": "",
    "file-pdf": "",
    "file-powerpoint-filled": "",
    "file-powerpoint": "",
    "file-restore-filled": "",
    "file-restore": "",
    "file-safety-filled": "",
    "file-safety": "",
    "file-search-filled": "",
    "file-search": "",
    "file-setting-filled": "",
    "file-setting": "",
    "file-teams-filled": "",
    "file-teams": "",
    "file-transmit-double-filled": "",
    "file-transmit-double": "",
    "file-transmit-filled": "",
    "file-transmit": "",
    "file-unknown-filled": "",
    "file-unknown": "",
    "file-unlocked-filled": "",
    "file-unlocked": "",
    "file-word-filled": "",
    "file-word": "",
    "file-zip-filled": "",
    "file-zip": "",
    file,
    "fill-color-1-filled": "",
    "fill-color-1": "",
    "fill-color-filled": "",
    "fill-color": "",
    "film-1-filled": "",
    "film-1": "",
    "film-filled": "",
    film,
    "filter-1-filled": "",
    "filter-1": "",
    "filter-2-filled": "",
    "filter-2": "",
    "filter-3-filled": "",
    "filter-3": "",
    "filter-clear-filled": "",
    "filter-clear": "",
    "filter-filled": "",
    "filter-off-filled": "",
    "filter-off": "",
    "filter-sort-filled": "",
    "filter-sort": "",
    filter,
    "fingerprint-1": "",
    "fingerprint-2": "",
    "fingerprint-3": "",
    fingerprint,
    "fish-filled": "",
    fish,
    "flag-1-filled": "",
    "flag-1": "",
    "flag-2-filled": "",
    "flag-2": "",
    "flag-3-filled": "",
    "flag-3": "",
    "flag-4-filled": "",
    "flag-4": "",
    "flag-filled": "",
    flag,
    "flashlight-filled": "",
    flashlight,
    "flight-landing-filled": "",
    "flight-landing": "",
    "flight-takeoff-filled": "",
    "flight-takeoff": "",
    "flip-smiling-face-filled": "",
    "flip-smiling-face": "",
    "flip-to-back-filled": "",
    "flip-to-back": "",
    "flip-to-front-filled": "",
    "flip-to-front": "",
    "focus-filled": "",
    focus,
    "fog-filled": "",
    "fog-night-filled": "",
    "fog-night": "",
    "fog-sunny-filled": "",
    "fog-sunny": "",
    fog,
    "folder-1-filled": "",
    "folder-1": "",
    "folder-add-1-filled": "",
    "folder-add-1": "",
    "folder-add-filled": "",
    "folder-add": "",
    "folder-blocked-filled": "",
    "folder-blocked": "",
    "folder-details-filled": "",
    "folder-details": "",
    "folder-export-filled": "",
    "folder-export": "",
    "folder-filled": "",
    "folder-import-filled": "",
    "folder-import": "",
    "folder-locked-filled": "",
    "folder-locked": "",
    "folder-minus-filled": "",
    "folder-minus": "",
    "folder-move-filled": "",
    "folder-move": "",
    "folder-off-filled": "",
    "folder-off": "",
    "folder-open-1-filled": "",
    "folder-open-1": "",
    "folder-open-filled": "",
    "folder-open": "",
    "folder-search-filled": "",
    "folder-search": "",
    "folder-setting-filled": "",
    "folder-setting": "",
    "folder-shared-filled": "",
    "folder-shared": "",
    "folder-unlocked-filled": "",
    "folder-unlocked": "",
    "folder-zip-filled": "",
    "folder-zip": "",
    folder,
    "forest-filled": "",
    forest,
    "fork-filled": "",
    fork,
    "form-filled": "",
    form,
    "format-horizontal-align-bottom": "",
    "format-horizontal-align-center": "",
    "format-horizontal-align-top": "",
    "format-vertical-align-center": "",
    "format-vertical-align-left": "",
    "format-vertical-align-right": "",
    "forward-filled": "",
    forward,
    "frame-1-filled": "",
    "frame-1": "",
    "frame-filled": "",
    frame,
    "fries-filled": "",
    fries,
    "fullscreen-1": "",
    "fullscreen-2": "",
    "fullscreen-exit-1": "",
    "fullscreen-exit": "",
    fullscreen,
    "function-curve": "",
    "functions-1": "",
    functions,
    "gamepad-1-filled": "",
    "gamepad-1": "",
    "gamepad-filled": "",
    gamepad,
    gamma,
    "garlic-filled": "",
    garlic,
    "gender-female": "",
    "gender-male": "",
    "gesture-applause-filled": "",
    "gesture-applause": "",
    "gesture-click-filled": "",
    "gesture-click": "",
    "gesture-down-filled": "",
    "gesture-down": "",
    "gesture-expansion-filled": "",
    "gesture-expansion": "",
    "gesture-left-filled": "",
    "gesture-left-slip-filled": "",
    "gesture-left-slip": "",
    "gesture-left": "",
    "gesture-open-filled": "",
    "gesture-open": "",
    "gesture-pray-filled": "",
    "gesture-pray": "",
    "gesture-press-filled": "",
    "gesture-press": "",
    "gesture-ranslation-filled": "",
    "gesture-ranslation": "",
    "gesture-right-filled": "",
    "gesture-right-slip-filled": "",
    "gesture-right-slip": "",
    "gesture-right": "",
    "gesture-slide-left-and-right-filled": "",
    "gesture-slide-left-and-right": "",
    "gesture-slide-up-filled": "",
    "gesture-slide-up": "",
    "gesture-typing-filled": "",
    "gesture-typing": "",
    "gesture-up-and-down-filled": "",
    "gesture-up-and-down": "",
    "gesture-up-filled": "",
    "gesture-up": "",
    "gesture-wipe-down-filled": "",
    "gesture-wipe-down": "",
    "gift-filled": "",
    gift,
    "giggle-filled": "",
    giggle,
    "git-branch-filled": "",
    "git-branch": "",
    "git-commit-filled": "",
    "git-commit": "",
    "git-merge-filled": "",
    "git-merge": "",
    "git-pull-request-filled": "",
    "git-pull-request": "",
    "git-repository-commits-filled": "",
    "git-repository-commits": "",
    "git-repository-filled": "",
    "git-repository-private-filled": "",
    "git-repository-private": "",
    "git-repository": "",
    "gps-filled": "",
    gps,
    "grape-filled": "",
    grape,
    "greater-than-or-equal": "",
    "greater-than": "",
    "green-onion": "",
    "grid-add-filled": "",
    "grid-add": "",
    "grid-view-filled": "",
    "grid-view": "",
    "guitar-filled": "",
    guitar,
    "hamburger-filled": "",
    hamburger,
    "happy-filled": "",
    happy,
    "hard-disk-storage-filled": "",
    "hard-disk-storage": "",
    "hard-drive-filled": "",
    "hard-drive": "",
    hashtag,
    "hd-filled": "",
    hd,
    "heart-filled": "",
    heart,
    "help-circle-filled": "",
    "help-circle": "",
    "help-rectangle-filled": "",
    "help-rectangle": "",
    help,
    "highlight-1-filled": "",
    "highlight-1": "",
    highlight,
    "history-setting": "",
    history,
    "home-filled": "",
    home,
    "horizontal-filled": "",
    horizontal,
    "hospital-1-filled": "",
    "hospital-1": "",
    "hospital-filled": "",
    hospital,
    "hotspot-wave-filled": "",
    "hotspot-wave": "",
    "hourglass-filled": "",
    hourglass,
    "houses-1-filled": "",
    "houses-1": "",
    "houses-2-filled": "",
    "houses-2": "",
    "houses-filled": "",
    houses,
    "html5-filled": "",
    html5,
    "https-filled": "",
    https,
    "ice-cream-filled": "",
    "ice-cream": "",
    "icon-filled": "",
    icon,
    "image-1-filled": "",
    "image-1": "",
    "image-add-filled": "",
    "image-add": "",
    "image-edit-filled": "",
    "image-edit": "",
    "image-error-filled": "",
    "image-error": "",
    "image-filled": "",
    "image-off-filled": "",
    "image-off": "",
    "image-search-filled": "",
    "image-search": "",
    image,
    "indent-left": "",
    "indent-right": "",
    "indicator-filled": "",
    indicator,
    "info-circle-filled": "",
    "info-circle": "",
    "ink-filled": "",
    ink,
    "install-desktop-filled": "",
    "install-desktop": "",
    "install-filled": "",
    "install-mobile-filled": "",
    "install-mobile": "",
    install,
    "institution-checked-filled": "",
    "institution-checked": "",
    "institution-filled": "",
    institution,
    "internet-filled": "",
    internet,
    "ipod-filled": "",
    ipod,
    "joyful-filled": "",
    joyful,
    "jump-double": "",
    "jump-off": "",
    jump,
    "key-filled": "",
    key,
    "keyboard-filled": "",
    keyboard,
    "laptop-filled": "",
    laptop,
    "layers-filled": "",
    layers,
    "layout-filled": "",
    layout,
    "leaderboard-filled": "",
    leaderboard,
    "lemon-filled": "",
    "lemon-slice-filled": "",
    "lemon-slice": "",
    lemon,
    "less-than-or-equal": "",
    "less-than": "",
    "letters-a": "",
    "letters-b": "",
    "letters-c": "",
    "letters-d": "",
    "letters-e": "",
    "letters-f": "",
    "letters-g": "",
    "letters-h": "",
    "letters-i": "",
    "letters-j": "",
    "letters-k": "",
    "letters-l": "",
    "letters-m": "",
    "letters-n": "",
    "letters-o": "",
    "letters-p": "",
    "letters-q": "",
    "letters-r": "",
    "letters-s": "",
    "letters-t": "",
    "letters-u": "",
    "letters-v": "",
    "letters-w": "",
    "letters-x": "",
    "letters-y": "",
    "letters-z": "",
    "lightbulb-circle-filled": "",
    "lightbulb-circle": "",
    "lightbulb-filled": "",
    lightbulb,
    "lighthouse-1-filled": "",
    "lighthouse-1": "",
    "lighthouse-2-filled": "",
    "lighthouse-2": "",
    "lighthouse-filled": "",
    lighthouse,
    "lighting-circle-filled": "",
    "lighting-circle": "",
    "line-height": "",
    "link-1": "",
    "link-unlink": "",
    link,
    "liquor-filled": "",
    liquor,
    "list-numbered": "",
    list,
    load,
    loading,
    "location-1-filled": "",
    "location-1": "",
    "location-enlargement-filled": "",
    "location-enlargement": "",
    "location-error-filled": "",
    "location-error": "",
    "location-filled": "",
    "location-parking-place-filled": "",
    "location-parking-place": "",
    "location-reduction-filled": "",
    "location-reduction": "",
    "location-setting-filled": "",
    "location-setting": "",
    location,
    "lock-off-filled": "",
    "lock-off": "",
    "lock-on-filled": "",
    "lock-on": "",
    "lock-time-filled": "",
    "lock-time": "",
    login,
    "logo-adobe-illustrate-filled": "",
    "logo-adobe-illustrate": "",
    "logo-adobe-lightroom-filled": "",
    "logo-adobe-lightroom": "",
    "logo-adobe-photoshop-filled": "",
    "logo-adobe-photoshop": "",
    "logo-android-filled": "",
    "logo-android": "",
    "logo-apple-filled": "",
    "logo-apple": "",
    "logo-behance": "",
    "logo-chrome-filled": "",
    "logo-chrome": "",
    "logo-cinema4d-filled": "",
    "logo-cinema4d": "",
    "logo-codepen": "",
    "logo-codesandbox": "",
    "logo-dribbble-filled": "",
    "logo-dribbble": "",
    "logo-facebook-filled": "",
    "logo-facebook": "",
    "logo-figma-filled": "",
    "logo-figma": "",
    "logo-framer-filled": "",
    "logo-framer": "",
    "logo-github-filled": "",
    "logo-github": "",
    "logo-gitlab-filled": "",
    "logo-gitlab": "",
    "logo-ie-filled": "",
    "logo-ie": "",
    "logo-instagram-filled": "",
    "logo-instagram": "",
    "logo-qq-filled": "",
    "logo-qq": "",
    "logo-twitter-filled": "",
    "logo-twitter": "",
    "logo-wechat-stroke-filled": "",
    "logo-wechat-stroke": "",
    "logo-wechatpay-filled": "",
    "logo-wechatpay": "",
    "logo-wecom-filled": "",
    "logo-wecom": "",
    "logo-windows-filled": "",
    "logo-windows": "",
    "logo-youtube-filled": "",
    "logo-youtube": "",
    logout,
    "look-around-filled": "",
    "look-around": "",
    "loudspeaker-filled": "",
    loudspeaker,
    "mail-filled": "",
    mail,
    "map-3d-filled": "",
    "map-3d": "",
    "map-add-filled": "",
    "map-add": "",
    "map-aiming-filled": "",
    "map-aiming": "",
    "map-blocked-filled": "",
    "map-blocked": "",
    "map-bubble-filled": "",
    "map-bubble": "",
    "map-cancel-filled": "",
    "map-cancel": "",
    "map-chat-filled": "",
    "map-chat": "",
    "map-checked-filled": "",
    "map-checked": "",
    "map-collection-filled": "",
    "map-collection": "",
    "map-connection-filled": "",
    "map-connection": "",
    "map-distance-filled": "",
    "map-distance": "",
    "map-double-filled": "",
    "map-double": "",
    "map-edit-filled": "",
    "map-edit": "",
    "map-filled": "",
    "map-grid-filled": "",
    "map-grid": "",
    "map-information-1-filled": "",
    "map-information-1": "",
    "map-information-2-filled": "",
    "map-information-2": "",
    "map-information-filled": "",
    "map-information": "",
    "map-location-filled": "",
    "map-location": "",
    "map-locked-filled": "",
    "map-locked": "",
    "map-marked-filled": "",
    "map-marked": "",
    "map-navigation-filled": "",
    "map-navigation": "",
    "map-outline-filled": "",
    "map-outline": "",
    "map-route-planning-filled": "",
    "map-route-planning": "",
    "map-ruler-filled": "",
    "map-ruler": "",
    "map-safety-filled": "",
    "map-safety": "",
    "map-search-1-filled": "",
    "map-search-1": "",
    "map-search-filled": "",
    "map-search": "",
    "map-setting-filled": "",
    "map-setting": "",
    "map-unlocked-filled": "",
    "map-unlocked": "",
    map,
    "mark-as-unread-filled": "",
    "mark-as-unread": "",
    "markup-filled": "",
    markup,
    "mathematics-filled": "",
    mathematics,
    "measurement-1-filled": "",
    "measurement-1": "",
    "measurement-2-filled": "",
    "measurement-2": "",
    "measurement-filled": "",
    measurement,
    "meat-pepper-filled": "",
    "meat-pepper": "",
    "media-library-filled": "",
    "media-library": "",
    "member-filled": "",
    member,
    "menu-application": "",
    "menu-filled": "",
    "menu-fold": "",
    "menu-unfold": "",
    menu,
    "merge-cells-filled": "",
    "merge-cells": "",
    "microphone-1-filled": "",
    "microphone-1": "",
    "microphone-2-filled": "",
    "microphone-2": "",
    "microphone-filled": "",
    microphone,
    "milk-filled": "",
    milk,
    "minus-circle-filled": "",
    "minus-circle": "",
    "minus-rectangle-filled": "",
    "minus-rectangle": "",
    minus,
    "mirror-filled": "",
    mirror,
    "mobile-blocked-filled": "",
    "mobile-blocked": "",
    "mobile-filled": "",
    "mobile-list-filled": "",
    "mobile-list": "",
    "mobile-navigation-filled": "",
    "mobile-navigation": "",
    "mobile-shortcut-filled": "",
    "mobile-shortcut": "",
    "mobile-vibrate-filled": "",
    "mobile-vibrate": "",
    mobile,
    "mode-dark-filled": "",
    "mode-dark": "",
    "mode-light-filled": "",
    "mode-light": "",
    "module-filled": "",
    module,
    "money-filled": "",
    money,
    "monument-filled": "",
    monument,
    "moon-fall-filled": "",
    "moon-fall": "",
    "moon-filled": "",
    "moon-rising-filled": "",
    "moon-rising": "",
    moon,
    more,
    "mosque-1-filled": "",
    "mosque-1": "",
    "mosque-filled": "",
    mosque,
    "mouse-filled": "",
    mouse,
    "move-1": "",
    move,
    "movie-clapper-filled": "",
    "movie-clapper": "",
    multiply,
    "museum-1-filled": "",
    "museum-1": "",
    "museum-2-filled": "",
    "museum-2": "",
    "museum-filled": "",
    museum,
    "mushroom-1-filled": "",
    "mushroom-1": "",
    "mushroom-filled": "",
    mushroom,
    "music-1-filled": "",
    "music-1": "",
    "music-2-filled": "",
    "music-2": "",
    "music-filled": "",
    "music-rectangle-add-filled": "",
    "music-rectangle-add": "",
    music,
    "navigation-arrow-filled": "",
    "navigation-arrow": "",
    "next-filled": "",
    next,
    "no-expression-filled": "",
    "no-expression": "",
    "noodle-filled": "",
    noodle,
    "notification-add-filled": "",
    "notification-add": "",
    "notification-circle-filled": "",
    "notification-circle": "",
    "notification-error-filled": "",
    "notification-error": "",
    "notification-filled": "",
    notification,
    "numbers-0-1": "",
    "numbers-0": "",
    "numbers-1-1": "",
    "numbers-1": "",
    "numbers-2-1": "",
    "numbers-2": "",
    "numbers-3-1": "",
    "numbers-3": "",
    "numbers-4-1": "",
    "numbers-4": "",
    "numbers-5-1": "",
    "numbers-5": "",
    "numbers-6-1": "",
    "numbers-6": "",
    "numbers-7-1": "",
    "numbers-7": "",
    "numbers-8-1": "",
    "numbers-8": "",
    "numbers-9-1": "",
    "numbers-9": "",
    "nut-filled": "",
    nut,
    "object-storage": "",
    "open-mouth-filled": "",
    "open-mouth": "",
    "opera-filled": "",
    opera,
    "order-adjustment-column": "",
    "order-ascending": "",
    "order-descending": "",
    "outbox-filled": "",
    outbox,
    "page-first": "",
    "page-head-filled": "",
    "page-head": "",
    "page-last": "",
    "palace-1-filled": "",
    "palace-1": "",
    "palace-2-filled": "",
    "palace-2": "",
    "palace-3-filled": "",
    "palace-3": "",
    "palace-4-filled": "",
    "palace-4": "",
    "palace-filled": "",
    palace,
    "palette-1-filled": "",
    "palette-1": "",
    "palette-filled": "",
    palette,
    "panorama-horizontal-filled": "",
    "panorama-horizontal": "",
    "panorama-vertical-filled": "",
    "panorama-vertical": "",
    "pantone-filled": "",
    pantone,
    parabola,
    parentheses,
    "paste-filled": "",
    paste,
    "patio-filled": "",
    patio,
    "pause-circle-filled": "",
    "pause-circle-stroke-filled": "",
    "pause-circle-stroke": "",
    "pause-circle": "",
    pause,
    "pea-filled": "",
    pea,
    "peach-filled": "",
    peach,
    "pear-filled": "",
    pear,
    "pearl-of-the-orient-filled": "",
    "pearl-of-the-orient": "",
    "pen-ball-filled": "",
    "pen-ball": "",
    "pen-brush-filled": "",
    "pen-brush": "",
    "pen-filled": "",
    "pen-mark-filled": "",
    "pen-mark": "",
    "pen-quill-filled": "",
    "pen-quill": "",
    pen,
    "pending-filled": "",
    pending,
    percent,
    "personal-information-filled": "",
    "personal-information": "",
    "phone-locked-filled": "",
    "phone-locked": "",
    "phone-search-filled": "",
    "phone-search": "",
    pi,
    "piano-filled": "",
    piano,
    "pin-filled": "",
    pin,
    "play-circle-filled": "",
    "play-circle-stroke-add-filled": "",
    "play-circle-stroke-add": "",
    "play-circle-stroke-filled": "",
    "play-circle-stroke": "",
    "play-circle": "",
    "play-demo-filled": "",
    "play-demo": "",
    "play-rectangle-filled": "",
    "play-rectangle": "",
    play,
    plus: plus2,
    "popsicle-filled": "",
    popsicle,
    "portrait-filled": "",
    portrait,
    "pout-filled": "",
    pout,
    poweroff,
    "precise-monitor": "",
    "previous-filled": "",
    previous,
    "print-filled": "",
    print,
    "pumpkin-filled": "",
    pumpkin,
    "pyramid-filled": "",
    "pyramid-maya-filled": "",
    "pyramid-maya": "",
    pyramid,
    qrcode,
    quadratic,
    "questionnaire-double-filled": "",
    "questionnaire-double": "",
    "questionnaire-filled": "",
    questionnaire,
    "queue-filled": "",
    queue,
    radar,
    "radio-1-filled": "",
    "radio-1": "",
    "radio-2-filled": "",
    "radio-2": "",
    "radish-filled": "",
    radish,
    "rain-heavy": "",
    "rain-light-filled": "",
    "rain-light": "",
    "rain-medium": "",
    rainbow,
    "rectangle-filled": "",
    rectangle,
    refresh,
    relation,
    "relativity-filled": "",
    relativity,
    "remote-wave-filled": "",
    "remote-wave": "",
    remove,
    "replay-filled": "",
    replay,
    "rice-ball-filled": "",
    "rice-ball": "",
    "rice-filled": "",
    rice,
    "roast-filled": "",
    roast,
    "rocket-filled": "",
    rocket,
    rollback,
    rollfront,
    "root-list-filled": "",
    "root-list": "",
    "rotate-locked-filled": "",
    "rotate-locked": "",
    rotate,
    rotation,
    "round-filled": "",
    round,
    "router-wave-filled": "",
    "router-wave": "",
    rss,
    "ruler-filled": "",
    ruler,
    "sailing-hotel-filled": "",
    "sailing-hotel": "",
    "sandwich-filled": "",
    sandwich,
    "saturation-filled": "",
    saturation,
    "sausage-filled": "",
    sausage,
    "save-filled": "",
    save,
    "saving-pot-filled": "",
    "saving-pot": "",
    scan,
    "screen-4k-filled": "",
    "screen-4k": "",
    "screencast-filled": "",
    screencast,
    screenshot,
    "scroll-bar-filled": "",
    "scroll-bar": "",
    "sd-card-1-filled": "",
    "sd-card-1": "",
    "sd-card-filled": "",
    "sd-card": "",
    "search-error-filled": "",
    "search-error": "",
    "search-filled": "",
    search,
    "secured-filled": "",
    secured,
    "send-cancel-filled": "",
    "send-cancel": "",
    "send-filled": "",
    send,
    "sensors-1": "",
    "sensors-2": "",
    "sensors-off": "",
    sensors,
    "sequence-filled": "",
    sequence,
    "serenity-filled": "",
    serenity,
    "server-filled": "",
    server,
    "service-filled": "",
    service,
    "setting-1-filled": "",
    "setting-1": "",
    "setting-filled": "",
    setting,
    "share-1-filled": "",
    "share-1": "",
    "share-filled": "",
    share,
    "sharpness-filled": "",
    sharpness,
    "shield-error-filled": "",
    "shield-error": "",
    "shimen-filled": "",
    shimen,
    "shop-1-filled": "",
    "shop-1": "",
    "shop-2-filled": "",
    "shop-2": "",
    "shop-3-filled": "",
    "shop-3": "",
    "shop-4-filled": "",
    "shop-4": "",
    "shop-5-filled": "",
    "shop-5": "",
    "shop-filled": "",
    shop,
    "shrimp-filled": "",
    shrimp,
    "shrink-horizontal": "",
    "shrink-vertical": "",
    "shutter-filled": "",
    shutter,
    "shutup-filled": "",
    shutup,
    "sim-card-1-filled": "",
    "sim-card-1": "",
    "sim-card-2-filled": "",
    "sim-card-2": "",
    "sim-card-filled": "",
    "sim-card": "",
    "sinister-smile-filled": "",
    "sinister-smile": "",
    "sip-filled": "",
    sip,
    "sitemap-filled": "",
    sitemap,
    slash,
    "sleep-filled": "",
    sleep,
    "slice-filled": "",
    slice,
    "slideshow-filled": "",
    slideshow,
    "smile-filled": "",
    smile,
    "sneer-filled": "",
    sneer,
    snowflake,
    sonic,
    "sound-down-filled": "",
    "sound-down": "",
    "sound-filled": "",
    "sound-high-filled": "",
    "sound-high": "",
    "sound-low-filled": "",
    "sound-low": "",
    "sound-mute-1-filled": "",
    "sound-mute-1": "",
    "sound-mute-filled": "",
    "sound-mute": "",
    "sound-up-filled": "",
    "sound-up": "",
    sound,
    space,
    "speechless-1-filled": "",
    "speechless-1": "",
    "speechless-filled": "",
    speechless,
    "star-filled": "",
    star,
    "statue-of-jesus-filled": "",
    "statue-of-jesus": "",
    "sticky-note-filled": "",
    "sticky-note": "",
    "stop-circle-filled": "",
    "stop-circle-stroke-filled": "",
    "stop-circle-stroke": "",
    "stop-circle": "",
    stop,
    "store-filled": "",
    store,
    "street-road-1-filled": "",
    "street-road-1": "",
    "street-road-filled": "",
    "street-road": "",
    "subtitle-filled": "",
    subtitle,
    "subway-line-filled": "",
    "subway-line": "",
    sum,
    "sun-fall-filled": "",
    "sun-fall": "",
    "sun-rising-filled": "",
    "sun-rising": "",
    "sunny-filled": "",
    sunny,
    "support-filled": "",
    support,
    "surprised-1-filled": "",
    "surprised-1": "",
    "surprised-filled": "",
    surprised,
    "swap-left": "",
    "swap-right": "",
    swap,
    "swear-1-filled": "",
    "swear-1": "",
    "swear-2-filled": "",
    "swear-2": "",
    "system-2": "",
    "system-3-filled": "",
    "system-3": "",
    "system-application-filled": "",
    "system-application": "",
    "system-blocked-filled": "",
    "system-blocked": "",
    "system-code-filled": "",
    "system-code": "",
    "system-components-filled": "",
    "system-components": "",
    "system-coordinate-filled": "",
    "system-coordinate": "",
    "system-device-filled": "",
    "system-device": "",
    "system-interface-filled": "",
    "system-interface": "",
    "system-location-filled": "",
    "system-location": "",
    "system-locked-filled": "",
    "system-locked": "",
    "system-log-filled": "",
    "system-log": "",
    "system-marked-filled": "",
    "system-marked": "",
    "system-messages-filled": "",
    "system-messages": "",
    "system-regulation-filled": "",
    "system-regulation": "",
    "system-search-filled": "",
    "system-search": "",
    "system-setting-filled": "",
    "system-setting": "",
    "system-storage-filled": "",
    "system-storage": "",
    "system-sum": "",
    "system-unlocked-filled": "",
    "system-unlocked": "",
    "tab-filled": "",
    tab,
    "table-1-filled": "",
    "table-1": "",
    "table-2-filled": "",
    "table-2": "",
    "table-add-filled": "",
    "table-add": "",
    "table-filled": "",
    "table-split-filled": "",
    "table-split": "",
    table,
    "tag-filled": "",
    tag,
    "tangerinr-filled": "",
    tangerinr,
    "tape-filled": "",
    tape,
    "task-1-filled": "",
    "task-1": "",
    "task-add-1": "",
    "task-add-filled": "",
    "task-add": "",
    "task-checked-1": "",
    "task-checked-filled": "",
    "task-checked": "",
    "task-double-filled": "",
    "task-double": "",
    "task-error-filled": "",
    "task-error": "",
    "task-filled": "",
    "task-location-filled": "",
    "task-location": "",
    "task-marked-filled": "",
    "task-marked": "",
    "task-setting-filled": "",
    "task-setting": "",
    "task-time-filled": "",
    "task-time": "",
    "task-visible-filled": "",
    "task-visible": "",
    task,
    "tea-filled": "",
    tea,
    "teahouse-filled": "",
    teahouse,
    "template-filled": "",
    template,
    "temple-filled": "",
    temple,
    "terminal-rectangle-1-filled": "",
    "terminal-rectangle-1": "",
    "terminal-rectangle-filled": "",
    "terminal-rectangle": "",
    "terminal-window-filled": "",
    "terminal-window": "",
    terminal,
    "textbox-filled": "",
    textbox,
    "textformat-bold": "",
    "textformat-color": "",
    "textformat-italic": "",
    "textformat-strikethrough": "",
    "textformat-underline": "",
    "textformat-wrap": "",
    "theaters-filled": "",
    theaters,
    "thumb-down-1-filled": "",
    "thumb-down-1": "",
    "thumb-down-2-filled": "",
    "thumb-down-2": "",
    "thumb-down-filled": "",
    "thumb-down": "",
    "thumb-up-1-filled": "",
    "thumb-up-1": "",
    "thumb-up-2-filled": "",
    "thumb-up-2": "",
    "thumb-up-filled": "",
    "thumb-up": "",
    thunder,
    "thunderstorm-night-filled": "",
    "thunderstorm-night": "",
    "thunderstorm-sunny-filled": "",
    "thunderstorm-sunny": "",
    thunderstorm,
    "ticket-filled": "",
    ticket,
    "time-filled": "",
    time,
    "tips-double-filled": "",
    "tips-double": "",
    "tips-filled": "",
    tips,
    "tomato-filled": "",
    tomato,
    "tools-circle-filled": "",
    "tools-circle": "",
    "tools-filled": "",
    tools,
    tornado,
    "tower-1-filled": "",
    "tower-1": "",
    "tower-2-filled": "",
    "tower-2": "",
    "tower-3-filled": "",
    "tower-3": "",
    "tower-clock-filled": "",
    "tower-clock": "",
    "tower-filled": "",
    tower,
    "town-filled": "",
    town,
    "traffic-events-filled": "",
    "traffic-events": "",
    "traffic-filled": "",
    traffic,
    "transform-1-filled": "",
    "transform-1": "",
    "transform-2": "",
    "transform-3": "",
    "transform-filled": "",
    transform,
    "translate-1": "",
    translate,
    "tree-round-dot-filled": "",
    "tree-round-dot-vertical-filled": "",
    "tree-round-dot-vertical": "",
    "tree-round-dot": "",
    "tree-square-dot-filled": "",
    "tree-square-dot-vertical-filled": "",
    "tree-square-dot-vertical": "",
    "tree-square-dot": "",
    "trending-down": "",
    "trending-up": "",
    "tv-1-filled": "",
    "tv-1": "",
    "tv-2-filled": "",
    "tv-2": "",
    "tv-filled": "",
    tv,
    "typography-filled": "",
    typography,
    "uncomfortable-1-filled": "",
    "uncomfortable-1": "",
    "uncomfortable-2-filled": "",
    "uncomfortable-2": "",
    "uncomfortable-filled": "",
    uncomfortable,
    "undertake-delivery-filled": "",
    "undertake-delivery": "",
    "undertake-environment-protection-filled": "",
    "undertake-environment-protection": "",
    "undertake-filled": "",
    "undertake-hold-up-filled": "",
    "undertake-hold-up": "",
    "undertake-transaction-filled": "",
    "undertake-transaction": "",
    undertake,
    "unfold-less": "",
    "unfold-more": "",
    "unhappy-1-filled": "",
    "unhappy-1": "",
    "unhappy-filled": "",
    unhappy,
    "uninstall-filled": "",
    uninstall,
    "upload-1": "",
    upload,
    upscale,
    "usb-filled": "",
    usb,
    "user-1-filled": "",
    "user-1": "",
    "user-add-filled": "",
    "user-add": "",
    "user-arrow-down-filled": "",
    "user-arrow-down": "",
    "user-arrow-left-filled": "",
    "user-arrow-left": "",
    "user-arrow-right-filled": "",
    "user-arrow-right": "",
    "user-arrow-up-filled": "",
    "user-arrow-up": "",
    "user-avatar-filled": "",
    "user-avatar": "",
    "user-blocked-filled": "",
    "user-blocked": "",
    "user-business-filled": "",
    "user-business": "",
    "user-checked-1-filled": "",
    "user-checked-1": "",
    "user-checked-filled": "",
    "user-checked": "",
    "user-circle-filled": "",
    "user-circle": "",
    "user-clear-filled": "",
    "user-clear": "",
    "user-error-1-filled": "",
    "user-error-1": "",
    "user-filled": "",
    "user-invisible-filled": "",
    "user-invisible": "",
    "user-list-filled": "",
    "user-list": "",
    "user-locked-filled": "",
    "user-locked": "",
    "user-marked-filled": "",
    "user-marked": "",
    "user-password-filled": "",
    "user-password": "",
    "user-safety-filled": "",
    "user-safety": "",
    "user-search-filled": "",
    "user-search": "",
    "user-setting-filled": "",
    "user-setting": "",
    "user-talk-1-filled": "",
    "user-talk-1": "",
    "user-talk-filled": "",
    "user-talk-off-1-filled": "",
    "user-talk-off-1": "",
    "user-talk": "",
    "user-time-filled": "",
    "user-time": "",
    "user-transmit-filled": "",
    "user-transmit": "",
    "user-unknown-filled": "",
    "user-unknown": "",
    "user-unlocked-filled": "",
    "user-unlocked": "",
    "user-vip-filled": "",
    "user-vip": "",
    "user-visible-filled": "",
    "user-visible": "",
    user,
    "usercase-filled": "",
    "usercase-link-filled": "",
    "usercase-link": "",
    usercase,
    "usergroup-add-filled": "",
    "usergroup-add": "",
    "usergroup-clear-filled": "",
    "usergroup-clear": "",
    "usergroup-filled": "",
    usergroup,
    "vehicle-filled": "",
    vehicle,
    "verified-filled": "",
    verified,
    "verify-filled": "",
    verify,
    "vertical-filled": "",
    vertical,
    "video-camera-1-filled": "",
    "video-camera-1": "",
    "video-camera-2-filled": "",
    "video-camera-2": "",
    "video-camera-3-filled": "",
    "video-camera-3": "",
    "video-camera-dollar-filled": "",
    "video-camera-dollar": "",
    "video-camera-filled": "",
    "video-camera-minus-filled": "",
    "video-camera-minus": "",
    "video-camera-music-filled": "",
    "video-camera-music": "",
    "video-camera-off-filled": "",
    "video-camera-off": "",
    "video-camera": "",
    "video-filled": "",
    "video-library-filled": "",
    "video-library": "",
    video,
    "view-agenda-filled": "",
    "view-agenda": "",
    "view-column": "",
    "view-in-ar-filled": "",
    "view-in-ar": "",
    "view-list": "",
    "view-module-filled": "",
    "view-module": "",
    "visual-recognition-filled": "",
    "visual-recognition": "",
    "wallet-filled": "",
    wallet,
    "watch-filled": "",
    watch,
    "watermelon-filled": "",
    watermelon,
    "wave-bye-filled": "",
    "wave-bye": "",
    "wave-left-filled": "",
    "wave-left": "",
    "wave-right-filled": "",
    "wave-right": "",
    "wealth-1-filled": "",
    "wealth-1": "",
    "wealth-filled": "",
    wealth,
    "widget-filled": "",
    widget,
    "wifi-1-filled": "",
    "wifi-1": "",
    "wifi-off-1-filled": "",
    "wifi-off-1": "",
    "wifi-off": "",
    wifi,
    "window-1-filled": "",
    "window-1": "",
    "window-filled": "",
    window,
    "windy-rain": "",
    windy,
    "wink-filled": "",
    wink,
    "work-filled": "",
    "work-history-filled": "",
    "work-history": "",
    "work-off-filled": "",
    "work-off": "",
    work,
    "wry-smile-filled": "",
    "wry-smile": "",
    "zoom-in-filled": "",
    "zoom-in": "",
    "zoom-out-filled": "",
    "zoom-out": ""
  };
  function isNumeric(value) {
    return /^(-)?\d+(\.\d+)?$/.test(value);
  }
  function isDef(value) {
    return value !== void 0 && value !== null;
  }
  function addUnit(value) {
    if (!isDef(value)) {
      return null;
    }
    value = String(value);
    return isNumeric(value) ? `${value}px` : value;
  }
  const isObject = (val) => val !== null && typeof val === "object";
  const ariaProps = {
    ariaHidden: Boolean,
    ariaRole: String,
    ariaLabel: String,
    ariaLabelledby: String,
    ariaDescribedby: String,
    ariaBusy: Boolean
    // lStyle: String
  };
  const IconProps = {
    ...ariaProps,
    lClass: String,
    name: {
      type: String,
      required: true
    },
    color: String,
    size: [String, Number],
    prefix: String,
    // type: String,
    inherit: {
      type: Boolean,
      default: true
    },
    web: {
      type: Boolean,
      default: true
    },
    lStyle: [String, Object, Array]
  };
  const name$1 = "l-icon";
  const _sfc_main$7 = vue.defineComponent({
    name: name$1,
    externalClasses: ["l-class"],
    options: {
      addGlobalClass: true,
      virtualHost: true
    },
    props: IconProps,
    emits: ["click"],
    setup(props, { emit }) {
      const $iconCollection = vue.inject("$iconCollection", null);
      const { $limeIconsHost: $iconsHost } = uni;
      const IconifyURL = "https://api.iconify.design/";
      const innerName = vue.computed(() => props.name || "");
      const hasHost = vue.computed(() => `${innerName.value}`.indexOf("/") !== -1);
      const isIconify = vue.computed(() => !hasHost.value && `${innerName.value}`.includes(":"));
      const collectionIcon = vue.computed(() => isObject($iconCollection) && $iconCollection.icons[innerName.value]);
      const isImage = vue.computed(() => {
        return /\.(jpe?g|png|gif|bmp|webp|tiff?)$/i.test(innerName.value) || /^data:image\/(jpeg|png|gif|bmp|webp|tiff);base64,/.test(innerName.value);
      });
      const isSVG = vue.computed(() => {
        return /\.svg$/i.test(innerName.value) || innerName.value.startsWith("data:image/svg+xml") || innerName.value.startsWith("<svg");
      });
      const classes = vue.computed(() => {
        const { prefix } = props;
        const iconPrefix = prefix || name$1;
        const iconName = `${iconPrefix}-${innerName.value}`;
        const isFont = !isImage.value && !isIconify.value && !isSVG.value;
        const isImages = isImage.value || isIconify.value || isSVG.value;
        const cls = {
          [iconPrefix]: !isImages && prefix,
          [iconName]: !isImages,
          [`${name$1}--image`]: isImages,
          [`${name$1}--font`]: isFont
          // [`is-inherit`]: isIconify.value && (props.color || props.inherit)
        };
        return cls;
      });
      const iconCode = vue.computed(() => {
        const isImages = isImage.value || isIconify.value || isSVG.value;
        return !isImages && icons[innerName.value] || (/[^\x00-\x7F]/.test(innerName.value) ? innerName.value : "");
      });
      const isError = vue.ref(false);
      const cacheMap = /* @__PURE__ */ new Map();
      const iconUrl = vue.computed(() => {
        const hasIconsHost = $iconsHost != null && $iconsHost != "";
        if (isImage.value) {
          return hasHost.value ? innerName.value : ($iconsHost || "") + innerName.value;
        } else if (isIconify.value) {
          if (cacheMap.has(innerName.value) && !isError.value) {
            return cacheMap.get(innerName.value);
          }
          const _host = `${hasIconsHost ? $iconsHost : IconifyURL}`;
          const _icon = collectionIcon.value || _host + `${innerName.value}.svg`.replace(/:/g, "/");
          cacheMap.set(innerName.value, _icon);
          return _icon;
        } else if (isSVG.value) {
          return (/\.svg$/i.test(innerName.value) && hasIconsHost && !hasHost.value ? $iconsHost : "") + innerName.value.replace(/'/g, '"');
        } else {
          return null;
        }
      });
      const styles = vue.computed(() => {
        const style = {
          "color": props.color
        };
        if (typeof props.size == "number" || props.size) {
          style["font-size"] = addUnit(props.size);
        }
        return style;
      });
      const imageLoad = () => {
        isError.value = false;
      };
      const imageError = () => {
        isError.value = true;
      };
      return {
        iconCode,
        classes,
        styles,
        isImage,
        isSVG,
        isIconify,
        iconUrl,
        imageLoad,
        imageError
      };
    }
  });
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_l_svg = resolveEasycom(vue.resolveDynamicComponent("l-svg"), __easycom_0$2);
    return !_ctx.isImage && !_ctx.isIconify && !_ctx.isSVG ? (vue.openBlock(), vue.createElementBlock(
      "text",
      {
        key: 0,
        class: vue.normalizeClass(["l-icon", [_ctx.classes]]),
        style: vue.normalizeStyle([_ctx.styles, _ctx.lStyle]),
        onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("click"))
      },
      vue.toDisplayString(_ctx.iconCode),
      7
      /* TEXT, CLASS, STYLE */
    )) : !_ctx.isSVG && !_ctx.isIconify && _ctx.isImage ? (vue.openBlock(), vue.createElementBlock("image", {
      key: 1,
      class: vue.normalizeClass(["l-icon", [_ctx.classes]]),
      style: vue.normalizeStyle([_ctx.styles, _ctx.lStyle]),
      src: _ctx.iconUrl,
      onClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("click"))
    }, null, 14, ["src"])) : (vue.openBlock(), vue.createBlock(_component_l_svg, {
      key: 2,
      class: vue.normalizeClass(["l-icon", [_ctx.classes]]),
      style: vue.normalizeStyle([_ctx.styles, _ctx.lStyle]),
      web: _ctx.web,
      color: _ctx.color,
      src: _ctx.iconUrl,
      onError: _ctx.imageError,
      onLoad: _ctx.imageLoad,
      onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("click"))
    }, null, 8, ["class", "style", "web", "color", "src", "onError", "onLoad"]));
  }
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-6fbe0909"], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/lime-icon/components/l-icon/l-icon.vue"]]);
  const badgeProps = {
    dot: Boolean,
    max: Number,
    color: String,
    offset: Array,
    content: [Number, String],
    showZero: Boolean,
    position: {
      type: String,
      default: "top-right"
    }
  };
  function isNumber(value) {
    return typeof value === "number" && !isNaN(value);
  }
  function getClassStr(obj) {
    let classNames = [];
    for (let key2 in obj) {
      if (obj.hasOwnProperty(key2) && obj[key2]) {
        classNames.push(key2);
      }
    }
    return classNames.join(" ");
  }
  function getOffsetWithMinusString(val) {
    return val.startsWith("-") ? val.replace("-", "") : `-${val}`;
  }
  const name = "l-badge";
  const _sfc_main$6 = vue.defineComponent({
    name,
    props: badgeProps,
    setup(props) {
      const context = vue.getCurrentInstance();
      const classes = vue.computed(() => {
        return getClassStr({
          [`${name}--fixed`]: context.slots.default,
          [`${name}--dot`]: props.dot,
          [`${name}--${props.position}`]: Boolean(context.slots["default"])
        });
      });
      const styles = vue.computed(() => {
        const style = {
          background: props.color
        };
        if (props.offset) {
          const [x, y] = props.offset;
          const { position } = props;
          const [offsetY, offsetX] = `${position}`.split("-");
          if (context.slots.default) {
            if (isNumber(y)) {
              style[offsetY] = addUnit(offsetY === "top" ? y : -y);
            } else {
              style[offsetY] = offsetY === "top" ? addUnit(y) : getOffsetWithMinusString(`${y}`);
            }
            if (isNumber(x)) {
              style[offsetX] = addUnit(offsetX === "left" ? x : -x);
            } else {
              style[offsetX] = offsetX === "left" ? addUnit(x) : getOffsetWithMinusString(`${x}`);
            }
          } else {
            style.marginTop = addUnit(y);
            style.marginLeft = addUnit(x);
          }
        }
        return style;
      });
      const hasContent = vue.computed(() => {
        if (Boolean(context.slots.content)) {
          return true;
        }
        const { content, showZero } = props;
        return isDef(content) && content !== "" && (showZero || content !== 0 && content !== "0");
      });
      const renderContent = vue.computed(() => {
        const { dot, max, content } = props;
        if (!dot && hasContent.value) {
          if (isDef(max) && max != 0 && isDef(content) && isNumeric(content) && +content > +max) {
            return `${max}+`;
          }
        }
        return content;
      });
      return {
        props,
        classes,
        styles,
        hasContent,
        renderContent
      };
    }
  });
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return _ctx.$slots.default ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      class: "l-badge__wrapper"
    }, [
      vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
      _ctx.hasContent || _ctx.props.dot ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 0,
          class: vue.normalizeClass(["l-badge", _ctx.classes]),
          style: vue.normalizeStyle([_ctx.styles])
        },
        [
          _ctx.$slots.content ? vue.renderSlot(_ctx.$slots, "content", { key: 0 }, void 0, true) : _ctx.renderContent ? (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            { key: 1 },
            [
              vue.createTextVNode(
                vue.toDisplayString(_ctx.renderContent),
                1
                /* TEXT */
              )
            ],
            64
            /* STABLE_FRAGMENT */
          )) : vue.createCommentVNode("v-if", true)
        ],
        6
        /* CLASS, STYLE */
      )) : vue.createCommentVNode("v-if", true)
    ])) : _ctx.hasContent || _ctx.props.dot ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 1,
        class: vue.normalizeClass(["l-badge", _ctx.classes]),
        style: vue.normalizeStyle([_ctx.styles])
      },
      [
        _ctx.$slots.content ? vue.renderSlot(_ctx.$slots, "content", { key: 0 }, void 0, true) : _ctx.renderContent ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 1 },
          [
            vue.createTextVNode(
              vue.toDisplayString(_ctx.renderContent),
              1
              /* TEXT */
            )
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true)
      ],
      6
      /* CLASS, STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-87f477b0"], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/lime-badge/components/l-badge/l-badge.vue"]]);
  const gridItemProps = {
    /**
     * 文本，可以通过 Props 传入文本，也可以自定义标题节点
     */
    text: {
      type: String
    },
    /**
     * 文本以外的更多描述，辅助信息。可以通过 Props 传入文本，也可以自定义标题节点
     */
    description: {
      type: String
    },
    /**
     * 点击后的跳转链接
     */
    url: {
      type: String
    },
    /**
     * 链接跳转类型
     */
    openType: {
      type: String,
      default: "navigateTo"
    },
    /**
     * 图标名称。值为字符串表示图标名称
     */
    icon: {
      type: String
    },
    /**
     * 图标名称。值为字符串表示图标名称
     */
    prefix: {
      type: String
    },
    /**
     * 图片，可以是图片地址
     */
    image: {
      type: String
    },
    imageWidth: {
      type: String
    },
    imageHeight: {
      type: String
    },
    bgColor: {
      type: String
    },
    layout: {
      type: String,
      default: "vertical"
    },
    padding: {
      type: String,
      default: null
    },
    dot: {
      type: Boolean,
      default: false
    },
    iconSize: {
      type: String
    },
    iconColor: {
      type: String
    },
    badge: {
      type: [String, Number]
    },
    borderColor: {
      type: String
    },
    lClass: {
      type: String
    },
    lClassIcon: {
      type: String
    },
    lStyle: {
      type: [String, Object, Array]
    },
    lTitleStyle: {
      type: [String, Object, Array]
    },
    lImageStyle: {
      type: [String, Object, Array]
    },
    lDescriptionStyle: {
      type: [String, Object, Array]
    }
  };
  const _sfc_main$5 = vue.defineComponent({
    name: "l-grid-item",
    props: gridItemProps,
    options: {
      addGlobalClass: true,
      virtualHost: true
    },
    emits: ["click"],
    setup(props, { emit }) {
      const parent = vue.inject("limeGrid", null);
      const instance = vue.getCurrentInstance();
      const index = vue.computed(() => (parent == null ? void 0 : parent.children.value.indexOf(instance.uid)) || -1);
      const column = vue.computed(() => (parent == null ? void 0 : parent.props.column) || 0);
      const gutter = vue.computed(() => (parent == null ? void 0 : parent.props.gutter) || 0);
      const hover = vue.computed(() => (parent == null ? void 0 : parent.props.hover) || false);
      const border = vue.computed(() => (parent == null ? void 0 : parent.props.border) || false);
      const align = vue.computed(() => (parent == null ? void 0 : parent.props.align) || "center");
      const size = vue.computed(() => {
        if (column.value > 4 || column.value == 0)
          return "small";
        return column.value < 4 ? "large" : "middle";
      });
      const styles = vue.computed(() => {
        const style = {};
        const percent2 = `calc((100% - ${(column.value - 1) * gutter.value}px) / ${column.value})`;
        style["flex-basis"] = percent2;
        if (index.value % column.value != column.value - 1) {
          style["margin-right"] = `${gutter.value}px`;
        }
        if (index.value >= column.value) {
          style["margin-top"] = `${gutter.value}px`;
        }
        if (props.borderColorl) {
          style["--l-grid-item-border-color"] = props.borderColor;
        }
        if (props.imageWidth) {
          style[size.value == "large" ? `--l-grid-item-image-width` : `--l-grid-item-${size.value}-width`] = props.imageWidth;
        }
        if (props.imageHeight) {
          style[size.value == "large" ? `--l-grid-item-image-height` : `--l-grid-item-${size.value}-height`] = props.imageHeight;
        }
        const bgColor = props.bgColor || (parent == null ? void 0 : parent.props.bgColor);
        if (bgColor) {
          style["background"] = bgColor;
        }
        const padding = props.padding || (parent == null ? void 0 : parent.props.padding);
        if (padding) {
          style["padding"] = padding;
        }
        return style;
      });
      const onClick = (e) => {
        emit("click", e);
        if (props.url == null)
          return;
        uni[props.openType]({ url: props.url });
      };
      vue.onBeforeMount(() => {
        if (instance && parent) {
          parent.children.value.push(instance.uid);
        }
      });
      vue.onUnmounted(() => {
        if (instance && parent) {
          parent.children.value = parent.children.value.filter((it) => it != instance.uid);
        }
      });
      return {
        styles,
        border,
        hover,
        align,
        size,
        onClick
      };
    }
  });
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_l_icon = resolveEasycom(vue.resolveDynamicComponent("l-icon"), __easycom_0$1);
    const _component_l_badge = resolveEasycom(vue.resolveDynamicComponent("l-badge"), __easycom_1$1);
    return vue.openBlock(), vue.createElementBlock("view", {
      ref: "gridRef",
      class: vue.normalizeClass(["l-grid-item", [
        "l-grid-item--" + _ctx.layout,
        "l-grid-item--" + _ctx.align,
        _ctx.border ? "l-grid-item--bordered" : ""
      ]]),
      onClick: _cache[0] || (_cache[0] = (...args) => _ctx.onClick && _ctx.onClick(...args)),
      "hover-stay-time": 200,
      "hover-class": _ctx.hover ? "l-grid-item--hover" : "",
      style: vue.normalizeStyle([_ctx.styles, _ctx.lStyle])
    }, [
      vue.renderSlot(_ctx.$slots, "default", {}, () => [
        (_ctx.dot || _ctx.badge) && (_ctx.icon || _ctx.image || _ctx.$slots["icon"]) ? (vue.openBlock(), vue.createBlock(_component_l_badge, {
          key: 0,
          content: _ctx.badge,
          dot: _ctx.dot
        }, {
          default: vue.withCtx(() => [
            vue.renderSlot(_ctx.$slots, "icon", {}, () => [
              _ctx.icon ? (vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: 0,
                  class: vue.normalizeClass(["l-grid-item__icon", ["l-grid-item__image--" + _ctx.size]])
                },
                [
                  vue.createVNode(_component_l_icon, {
                    "l-class": _ctx.lClassIcon,
                    prefix: _ctx.prefix,
                    name: _ctx.icon,
                    color: _ctx.iconColor,
                    size: _ctx.iconSize
                  }, null, 8, ["l-class", "prefix", "name", "color", "size"])
                ],
                2
                /* CLASS */
              )) : _ctx.image ? (vue.openBlock(), vue.createElementBlock("image", {
                key: 1,
                class: vue.normalizeClass(["l-grid-item__image", ["l-grid-item__image--" + _ctx.size]]),
                style: vue.normalizeStyle([_ctx.lImageStyle]),
                src: _ctx.image,
                mode: "aspectFill"
              }, null, 14, ["src"])) : vue.createCommentVNode("v-if", true)
            ], true)
          ]),
          _: 3
          /* FORWARDED */
        }, 8, ["content", "dot"])) : _ctx.icon || _ctx.image || _ctx.$slots["icon"] ? vue.renderSlot(_ctx.$slots, "icon", { key: 1 }, () => [
          _ctx.icon ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 0,
              class: vue.normalizeClass(["l-grid-item__icon", ["l-grid-item__image--" + _ctx.size]])
            },
            [
              vue.createVNode(_component_l_icon, {
                "l-class": _ctx.lClassIcon,
                prefix: _ctx.prefix,
                name: _ctx.icon,
                color: _ctx.iconColor,
                size: _ctx.iconSize
              }, null, 8, ["l-class", "prefix", "name", "color", "size"])
            ],
            2
            /* CLASS */
          )) : _ctx.image ? (vue.openBlock(), vue.createElementBlock("image", {
            key: 1,
            class: vue.normalizeClass(["l-grid-item__image", ["l-grid-item__image--" + _ctx.size]]),
            style: vue.normalizeStyle([_ctx.lImageStyle]),
            src: _ctx.image,
            mode: "aspectFill"
          }, null, 14, ["src"])) : vue.createCommentVNode("v-if", true)
        ], true) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "l-grid-item__content" }, [
          vue.renderSlot(_ctx.$slots, "text", {}, () => [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["l-grid-item__title", ["l-grid-item__title--" + _ctx.size]]),
                style: vue.normalizeStyle([_ctx.lTitleStyle])
              },
              vue.toDisplayString(_ctx.text),
              7
              /* TEXT, CLASS, STYLE */
            )
          ], true),
          vue.renderSlot(_ctx.$slots, "description", {}, () => [
            vue.createElementVNode(
              "view",
              {
                class: "l-grid-item__description",
                style: vue.normalizeStyle([_ctx.lDescriptionStyle])
              },
              vue.toDisplayString(_ctx.description),
              5
              /* TEXT, STYLE */
            )
          ], true)
        ])
      ], true),
      vue.renderSlot(_ctx.$slots, "extra", {}, void 0, true)
    ], 14, ["hover-class"]);
  }
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-d1ffdc22"], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/lime-grid/components/l-grid-item/l-grid-item.vue"]]);
  const gridProps = {
    /** 内容对齐方式 */
    align: {
      type: String,
      default: "center"
    },
    /** 边框，默认不显示。值为 true 则显示默认边框 */
    border: {
      type: Boolean,
      default: false
    },
    /** 每一行的列数量；为 0 时等于固定大小 */
    column: {
      type: Number,
      default: 4
    },
    /** 间隔大小 */
    gutter: {
      type: Number,
      default: 0
    },
    wrap: {
      type: Boolean,
      default: true
    },
    /** 是否开启点击反馈 */
    hover: {
      type: Boolean,
      default: false
    },
    /** 是否展示为圆角卡片风格 */
    inset: {
      type: Boolean,
      default: false
    },
    bgColor: {
      type: String,
      default: null
    },
    padding: {
      type: String,
      default: null
    }
  };
  const _sfc_main$4 = vue.defineComponent({
    name: "l-grid",
    props: gridProps,
    setup(props) {
      vue.getCurrentInstance();
      const width = vue.ref(0);
      const children = vue.ref([]);
      vue.provide("limeGrid", {
        children,
        props,
        width
      });
    }
  });
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["l-grid", {
          "l-grid--inset": _ctx.inset,
          "l-grid--wrap": _ctx.wrap,
          "l-grid--bordered": _ctx.border && _ctx.gutter == 0
        }]),
        ref: "resizeRef"
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      2
      /* CLASS */
    );
  }
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-1acc5755"], ["__file", "D:/Code/Dev/GXA/Client/DevApp/uni_modules/lime-grid/components/l-grid/l-grid.vue"]]);
  const SYSTEM_INFO = uni.getSystemInfoSync();
  const getStatusBarHeight = () => SYSTEM_INFO.statusBarHeight;
  const _imports_0 = "/static/logo.png";
  const _sfc_main$3 = {
    __name: "user",
    setup(__props, { expose: __expose }) {
      __expose();
      const barheight = vue.ref(getStatusBarHeight());
      function status() {
        formatAppLog("log", "at pages/user/user.vue:42", barheight.value);
      }
      status();
      const __returned__ = { barheight, status, ref: vue.ref, get getStatusBarHeight() {
        return getStatusBarHeight;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_l_grid_item = resolveEasycom(vue.resolveDynamicComponent("l-grid-item"), __easycom_0);
    const _component_l_grid = resolveEasycom(vue.resolveDynamicComponent("l-grid"), __easycom_1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "userLayout pageBg" }, [
      vue.createElementVNode(
        "view",
        {
          class: "statuBar",
          style: vue.normalizeStyle({ height: $setup.barheight + "px" })
        },
        null,
        4
        /* STYLE */
      ),
      vue.createElementVNode("view", { class: "userInfo" }, [
        vue.createElementVNode("view", { class: "avator" }, [
          vue.createElementVNode("image", {
            src: _imports_0,
            mode: "aspectFill"
          })
        ]),
        vue.createElementVNode("view", { class: "info" }, [
          vue.createElementVNode("view", { class: "name" }, " 张三 "),
          vue.createElementVNode("view", { class: "level" }, " 一级警员 ")
        ])
      ]),
      vue.createCommentVNode(' <view class="userfuns">\r\n		 <funs-one v-for="item in 7"></funs-one>\r\n		</view> '),
      vue.createCommentVNode(" <lime-grid /> "),
      vue.createVNode(_component_l_grid, null, {
        default: vue.withCtx(() => [
          vue.createVNode(_component_l_grid_item, {
            text: "会议",
            dot: true,
            image: "/static/userFuns/meet.png"
          }),
          vue.createVNode(_component_l_grid_item, {
            text: "OA",
            badge: "5",
            image: "/static/userFuns/oa.png"
          }),
          vue.createVNode(_component_l_grid_item, {
            text: "休假",
            badge: "15",
            image: "/static/userFuns/leave.png"
          }),
          vue.createVNode(_component_l_grid_item, {
            text: "值班",
            badge: "New",
            image: "/static/userFuns/duty.png"
          })
        ]),
        _: 1
        /* STABLE */
      })
    ]);
  }
  const PagesUserUser = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__file", "D:/Code/Dev/GXA/Client/DevApp/pages/user/user.vue"]]);
  const _sfc_main$2 = {};
  function _sfc_render$1(_ctx, _cache) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "" });
  }
  const PagesFunsFuns = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "D:/Code/Dev/GXA/Client/DevApp/pages/funs/funs.vue"]]);
  const _sfc_main$1 = {};
  function _sfc_render(_ctx, _cache) {
    return vue.openBlock(), vue.createElementBlock("view");
  }
  const PagesWorkWork = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "D:/Code/Dev/GXA/Client/DevApp/pages/work/work.vue"]]);
  __definePage("pages/user/user", PagesUserUser);
  __definePage("pages/funs/funs", PagesFunsFuns);
  __definePage("pages/work/work", PagesWorkWork);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/Code/Dev/GXA/Client/DevApp/App.vue"]]);
  function createApp() {
    const app2 = vue.createVueApp(App);
    return {
      app: app2
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
