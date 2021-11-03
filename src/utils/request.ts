import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessageBox, ElMessage } from 'element-plus'
import store from '@/store'
import { getToken } from '@/utils/auth'

function hasObj(data: any) {
  let flag = false
  for (let k in data) {
    if (data[k] && typeof data[k] === 'object') {
      flag = true
      break
    }
  }
  return flag
}

// create an axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API, // BASE_API
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  // withCredentials: true, // send cookies when cross-domain requests
   // 修改请求数据
   transformRequest: [
    function(data: any) {
      if (hasObj(data)) {
        return JSON.stringify(data)
      }
      let ret = ''
      for (const it in data) {
        // 去除空字符串的请求字段
        if (data[it] !== '') {
          if (ret !== '') ret += '&'
          ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it])
        }
      }
      return ret
    }
  ],
  timeout: 5000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  (config: AxiosRequestConfig<any>) => {
    // do something before request is sent

    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['X-Token'] = getToken()
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
   (response: AxiosResponse) => {
    const res = response.data as any

    // if the custom code is not 20000, it is judged as an error.
    if (res.code !== 20000) {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        // to re-login
        ElMessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
          confirmButtonText: 'Re-Login',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res
    }
  },
  (error: AxiosError) => {
    console.log('err' + error) // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service