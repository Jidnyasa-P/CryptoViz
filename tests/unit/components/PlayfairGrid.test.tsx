import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PlayfairGrid from '../../../components/cipher/PlayfairGrid'

const SAMPLE_MATRIX = 'MONARCHYBDEFGIKLPQSTUVWXZ' // 25 chars -> 5x5

describe('PlayfairGrid', () => {
  it('renders nothing when no matrix is provided', () => {
    const { container } = render(<PlayfairGrid />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a 5x5 grid with proper ARIA roles', () => {
    render(<PlayfairGrid matrix={SAMPLE_MATRIX} />)
    expect(screen.getByRole('grid', { name: 'Playfair 5x5 key square' })).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(25)
  })

  it('marks highlighted cells with aria-selected="true" and others "false"', () => {
    render(<PlayfairGrid matrix={SAMPLE_MATRIX} highlights={[0, 6]} />)
    const cells = screen.getAllByRole('gridcell')
    expect(cells[0]).toHaveAttribute('aria-selected', 'true')
    expect(cells[6]).toHaveAttribute('aria-selected', 'true')
    expect(cells[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('gives each cell a descriptive aria-label', () => {
    render(<PlayfairGrid matrix={SAMPLE_MATRIX} highlights={[0]} />)
    expect(screen.getByLabelText('Row 1, column 1: M, highlighted')).toBeInTheDocument()
    expect(screen.getByLabelText('Row 1, column 2: O')).toBeInTheDocument()
  })

  it('only the focused cell is in the tab order (roving tabindex)', () => {
    render(<PlayfairGrid matrix={SAMPLE_MATRIX} />)
    const cells = screen.getAllByRole('gridcell')
    expect(cells[0]).toHaveAttribute('tabindex', '0')
    expect(cells[1]).toHaveAttribute('tabindex', '-1')
  })

  it('moves focus with arrow keys', () => {
    render(<PlayfairGrid matrix={SAMPLE_MATRIX} />)
    const cells = screen.getAllByRole('gridcell')
    act(() => cells[0].focus())
    fireEvent.keyDown(cells[0], { key: 'ArrowRight' })
    expect(cells[1]).toHaveFocus()

    fireEvent.keyDown(cells[1], { key: 'ArrowDown' })
    expect(cells[6]).toHaveFocus()
  })

  it('does not move focus past grid edges', () => {
    render(<PlayfairGrid matrix={SAMPLE_MATRIX} />)
    const cells = screen.getAllByRole('gridcell')
    act(() => cells[0].focus())
    fireEvent.keyDown(cells[0], { key: 'ArrowLeft' })
    expect(cells[0]).toHaveFocus()
    fireEvent.keyDown(cells[0], { key: 'ArrowUp' })
    expect(cells[0]).toHaveFocus()
  })

  it('Home/End jump to the first and last cell', () => {
    render(<PlayfairGrid matrix={SAMPLE_MATRIX} />)
    const cells = screen.getAllByRole('gridcell')
    act(() => cells[12].focus())
    fireEvent.keyDown(cells[12], { key: 'End' })
    expect(cells[24]).toHaveFocus()
    fireEvent.keyDown(cells[24], { key: 'Home' })
    expect(cells[0]).toHaveFocus()
  })
})
