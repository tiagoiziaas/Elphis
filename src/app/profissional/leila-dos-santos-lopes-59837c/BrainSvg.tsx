'use client'
import React, { useEffect, useState } from 'react'

export default function BrainSvg(props: React.HTMLAttributes<HTMLDivElement>) {
  const [svgContent, setSvgContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/Cerebro.svg')
      .then(res => res.text())
      .then(svg => {
        setSvgContent(svg)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to load SVG:', err)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return <div className='brain-svg w-full max-w-[420px] h-auto bg-transparent' />
  }

  return (
    <div
      className='brain-svg'
      dangerouslySetInnerHTML={{ __html: svgContent }}
      {...props}
    />
  )
}
