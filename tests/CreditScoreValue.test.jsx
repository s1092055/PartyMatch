import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CreditScoreValue from '../src/components/ui/CreditScoreValue'

describe('CreditScoreValue', () => {
  it('score 為 0/null/undefined 時顯示「不限」，不畫箭頭 icon', () => {
    const { rerender, container } = render(<CreditScoreValue score={0} />)
    expect(screen.getByText('不限')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()

    rerender(<CreditScoreValue score={null} />)
    expect(screen.getByText('不限')).toBeInTheDocument()

    rerender(<CreditScoreValue score={undefined} />)
    expect(screen.getByText('不限')).toBeInTheDocument()
  })

  it('有分數時顯示「N 分」加箭頭 icon', () => {
    render(<CreditScoreValue score={80} />)
    expect(screen.getByText(/80 分/)).toBeInTheDocument()
    expect(document.querySelector('svg')).toBeInTheDocument()
  })
})
