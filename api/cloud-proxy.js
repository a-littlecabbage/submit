// Vercel API 代理
// 文件路径: h5/api/cloud-proxy.js
// 用途: H5前端通过此代理调用微信云函数，避免在浏览器端暴露 access_token

export default async function handler(req, res) {
  // 只接受 POST 请求
  if (req.method !== 'POST') {
