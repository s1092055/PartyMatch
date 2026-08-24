import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FavoriteToggleButton from '../src/components/ui/FavoriteToggleButton'

describe('FavoriteToggleButton', () => {
  it('已收藏：紅底、白色愛心，且不含未收藏狀態的 bg-surface', () => {
    render(<FavoriteToggleButton isFav onClick={() => {}} />)
    const button = screen.getByRole('button', { name: '取消收藏' })
    expect(button.className).toContain('bg-danger')
    expect(button.className).not.toContain('bg-surface')

    const heart = button.querySelector('svg')
    expect(heart.getAttribute('class')).toContain('fill-white')
  })

  it('未收藏：中性背景，愛心沒有填色', () => {
    render(<FavoriteToggleButton isFav={false} onClick={() => {}} />)
    const button = screen.getByRole('button', { name: '加入收藏' })
    expect(button.className).toContain('bg-surface')
    expect(button.className).not.toContain('bg-danger')

    const heart = button.querySelector('svg')
    expect(heart.getAttribute('class')).not.toContain('fill-white')
  })

  it('點擊會觸發 onClick', () => {
    const onClick = vi.fn()
    render(<FavoriteToggleButton isFav={false} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('square 為 true 時用方形圓角，預設是全圓形', () => {
    const { rerender } = render(<FavoriteToggleButton isFav={false} onClick={() => {}} />)
    expect(screen.getByRole('button').className).toContain('rounded-full')

    rerender(<FavoriteToggleButton isFav={false} onClick={() => {}} square />)
    expect(screen.getByRole('button').className).toContain('rounded-xl')
  })
});
