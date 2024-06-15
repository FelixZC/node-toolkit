import { Button } from 'antd'
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
const NoMatch = () => {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div
      style={{
        margin: 30,
        textAlign: 'center'
      }}
    >
      <h3>
        No match for <code>{location.pathname}</code>
      </h3>

      <Button size="small" type="primary" ghost onClick={() => navigate(-1)}>
        返回
      </Button>
    </div>
  )
}
export default NoMatch
