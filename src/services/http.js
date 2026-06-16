import axios from 'axios'
import { API_CONFIG } from './config'

// 通用 HTTP 请求封装
const createClient = (baseURL, timeout = 10000) => {
  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      console.error(`API Error [${baseURL}]:`, error.message)
      return Promise.reject(error)
    }
  )

  return client
}

// 聚合数据客户端
const juheClient = createClient(API_CONFIG.juhe.baseUrl)

// wheniskickoff 客户端
const wheniskickoffClient = createClient(API_CONFIG.wheniskickoff.baseUrl, 15000)

// TheSportsDB 客户端
const theSportsDbClient = createClient(API_CONFIG.theSportsDb.baseUrl)

// 懂球帝客户端
const dongqiudiClient = createClient(API_CONFIG.dongqiudi.baseUrl, 15000)

// 咪咕客户端
const miguClient = createClient(API_CONFIG.migu.baseUrl, 15000)

export { juheClient, wheniskickoffClient, theSportsDbClient, dongqiudiClient, miguClient }
