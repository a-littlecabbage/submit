// Vercel API 代理
// 文件路径: h5/api/cloud-proxy.js
// 用途: H5前端通过此代理调用微信云函数，避免在浏览器端暴露 access_token

export default async function handler(req, res) {
  // 只接受 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { functionName, data } = req.body

  if (!functionName) {
    return res.status(400).json({ error: 'Missing functionName' })
  }

  try {
    // Step 1: 获取 access_token
    const appId = process.env.WX_APPID
    const secret = process.env.WX_SECRET

    if (!appId || !secret) {
      return res.status(500).json({ error: 'Missing WX_APPID or WX_SECRET env vars' })
    }

    const tokenRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.errcode) {
      return res.status(500).json({ error: 'Failed to get access_token', detail: tokenData })
    }

    const accessToken = tokenData.access_token

    // Step 2: 调用云函数
    const envId = process.env.WX_CLOUD_ENV_ID
    const cloudRes = await fetch(
      `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${accessToken}&env=${envId}&name=${functionName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      }
    )

    const cloudData = await cloudRes.json()

    if (cloudData.errcode !== 0) {
      return res.status(500).json({ error: 'Cloud function error', detail: cloudData })
    }

    // 微信云函数返回的数据在 resp_body 字段中（JSON字符串）
    const result = typeof cloudData.resp_body === 'string'
      ? JSON.parse(cloudData.resp_body)
      : cloudData.resp_body

    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
