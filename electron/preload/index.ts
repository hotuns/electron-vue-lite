// 导入所有桥接模块
import './bridges/ipc'
import './bridges/window'
import './bridges/windowControls'
import './bridges/store'
import './bridges/app'
import './bridges/update'
import './bridges/pythonService'

// 导入加载动画
import { domReady, useLoading } from './loading/loading'

// --------- Preload scripts loading ---------
const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
