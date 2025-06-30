import { createRouter, createWebHashHistory } from "vue-router";


const routeMap = [
    {
        path: "/",
        component: () => import("./views/index.vue"),
    },
    {
        path: "/count",
        component: () => import("./views/count.vue"),
    }

];

const router = createRouter({
    // 指定使用Hash路由
    history: createWebHashHistory(),
    // 路由规则数组，每一个路由规则都是一个对象
    routes: routeMap
});

// 在路由跳转之前执行，可以用于进行全局的访问控制或重定向跳转等操作
router.beforeEach((to, from, next) => {
    // ...
    // 继续执行下一个路由守卫
    next();
});

// 在路由跳转完成后执行，可以用于对页面进行一些操作，如监测页面埋点等
router.afterEach((to, from) => {
});

export default router;