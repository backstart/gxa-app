
#### 使用方法

##uniapp专属精品组件页面模板（由前端组件开发出品）精品组件页面模板

###●组件模板规划：
由前端组件开发出品的精品组件页面模板，将陆续发布，预计高达约几百种供您使用，是快速快发项目、创业的必备精品。

合集地址： uni-app模板合集地址：(https://ext.dcloud.net.cn/publisher?id=274945) 如查看全部页面模板，请前往上述uniapp插件市场合集地址；

###●组件模板效果图：
可下载项目后预览，效果图见右侧图片；

###●组件模板费用：
学习：免费下载，进行学习，无费用；

使用/商用：本页面地址赞赏10元后，可终身商用；

###●组件模板使用版权/商用：
本组件模板免费下载可供学习，如需使用及商用，请在本组件页面模板进行赞赏10元

（仅需10元获取精品页面模板代码-物有所值，1个组件页面市场价100元 ）

赞赏10元后（当前项目产生赞赏订单可追溯）即可终身商用当前本地址下载的页面模版代码，不同下载地址需进行不同的赞赏。（不赞赏就进行商用使用者，面临侵权！保留追究知识产权法律责任！后果自负！）

### 我的技术公众号(私信可加前端技术交流群)

群内气氛挺不错的，应该或许可能大概，算是为数不多的，专搞技术的前端群，偶尔聊天摸鱼

![图片](https://i.postimg.cc/RZ0sjnYP/front-End-Component.jpg)



```使用方法

 <div class="mui-content-padded">
           
 <!-- 列表组件 -->
            
<cc-listView :productList="projectList" @click="goProDetail"></cc-listView>

       
 </div>

       
 <!--  totalNum: 条目总数量  pageCount:设置分页数量  curPageNum:设置当前页-->
       
 <cc-listPageView :totalNum="totalNum" pageCount="10" :curPageNum="curPageNum" @pageClick="pageClick">
       
 </cc-listPageView>

```

#### HTML代码实现部分
```html


<template>
    <view class="content">

        <div class="mui-content-padded">

            <!-- 列表组件 -->
            <cc-listView :productList="projectList" @click="goProDetail"></cc-listView>

        </div>

        <!--  totalNum: 条目总数量  pageCount:设置分页数量  curPageNum:设置当前页-->
        <cc-listPageView :totalNum="totalNum" pageCount="10" :curPageNum="curPageNum" @pageClick="pageClick">
        </cc-listPageView>

    </view>
</template>


<script>
  
    export default {
        components: {

           

        },
        data() {
            return {

                totalNum: 0,
                curPageNum: 1,

                // 列表数组
                projectList: []
            }
        },
        onLoad () {

            this.requestData();
        },
        methods: {
            // 列表条目点击事件
            goProDetail(item) {

            },
            // 分页事件
            pageClick(tag) {

                if (tag === 0) {
                    // 上一页 (不等于第一页)
                    if (this.curPageNum > 1) {

                        this.curPageNum--;
                        this.requestData();
                    }
                } else {
                    // 下一页 (不等于最后一页)
                    if (this.totalNum > (this.curPageNum * 10)) {
                        this.curPageNum++;
                        this.requestData();
                    }

                }

            },

            requestData() {

                // 模拟请求参数设置
                let reqData = {

                    'area': '',
                    "pageSize": 10,
                    "pageNo": this.curPageNum
                }
                // 模拟请求接口
                this.totalNum = 39;
                this.projectList = [];
                for (let i = 0; i < 10; i++) {

                    this.projectList.push({
                        'proName': '项目名称' + i,
                        'proUnit': '公司名称' + i,
                        'area': '广州',
                        'proType': '省级项目',
                        'stage': '已开工',
                        'id': i + ''
                    });
                }
            }
       
		}
    }
</script>


<style>
    page {

        background-color: #f7f7f7;
    }

    .content {
        display: flex;
        flex-direction: column;

    }

    .mui-content-padded {
        margin: 0px 14px;
        /* background-color: #ffffff; */
    }
</style>




```
