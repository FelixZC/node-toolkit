import { Button, Result } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'
const Exception403 = () => {
  const navigate = useNavigate()
  return (
    <Result
      status="403"
      title={
        <Button type="primary" ghost onClick={() => navigate('/home')}>
          去首页
        </Button>
      }
      subTitle="Sorry, you are not authorized to access this page."
    />
  )
}
export default Exception403
