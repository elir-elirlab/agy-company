import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { I18nProvider } from '../i18n/context';

describe('ActivityHeatmap Component', () => {
  // Mock API response for daily calendar
  const mockCalendarResponse = {
    year: 2026,
    month: 9,
    today: '2026-09-14',
    active_dates: ['2026-09-01', '2026-09-08', '2026-09-14']
  };

  beforeEach(() => {
    // Set default language to 'ja' in localStorage to match test assertions
    localStorage.setItem('agy_company_language', 'ja');

    // Reset and setup global fetch mock before each test
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCalendarResponse)
      })
    ));
  });

  it('renders calendar title, week days, and active days summary', async () => {
    const onOpenFile = vi.fn();
    render(
      <I18nProvider>
        <ActivityHeatmap todayDate="2026-09-14" onOpenFile={onOpenFile} />
      </I18nProvider>
    );

    // Verify loading indicator or header title is present
    expect(screen.getByText('活動カレンダー')).toBeInTheDocument();

    // Wait for the calendar cells and summary to be rendered after data fetch
    await waitFor(() => {
      // Check summary: 3 / 30 active days (10%)
      expect(screen.getByText(/3 \/ 30/)).toBeInTheDocument();
    });
  });

  it('calls onOpenFile when an active cell is clicked', async () => {
    const onOpenFile = vi.fn();
    const { container } = render(
      <I18nProvider>
        <ActivityHeatmap todayDate="2026-09-14" onOpenFile={onOpenFile} />
      </I18nProvider>
    );

    // Wait for active cells to render with bg-emerald-500 class
    await waitFor(() => {
      const activeCells = container.querySelectorAll('.bg-emerald-500');
      expect(activeCells.length).toBe(3);
    });

    // Click the first active cell (corresponding to 2026-09-01)
    const activeCells = container.querySelectorAll('.bg-emerald-500');
    fireEvent.click(activeCells[0]);

    // Verify onOpenFile is invoked with the expected daily note relative path
    expect(onOpenFile).toHaveBeenCalledTimes(1);
    expect(onOpenFile).toHaveBeenCalledWith('02_Daily/2026-09-01.md');
  });

  it('disables next month navigation when currently on the current month', async () => {
    const onOpenFile = vi.fn();
    render(
      <I18nProvider>
        <ActivityHeatmap todayDate="2026-09-14" onOpenFile={onOpenFile} />
      </I18nProvider>
    );

    // Wait for the calendar to finish loading
    await waitFor(() => {
      expect(screen.getByText(/3 \/ 30/)).toBeInTheDocument();
    });

    // Locate the next month button (chevron right)
    const buttons = screen.getAllByRole('button');
    // Prev button is index 0, Next button is index 1
    const nextButton = buttons[1];

    // Assert that the next button is disabled since we cannot navigate to future months
    expect(nextButton).toBeDisabled();
  });

  it('allows navigating to the previous month', async () => {
    const onOpenFile = vi.fn();
    render(
      <I18nProvider>
        <ActivityHeatmap todayDate="2026-09-14" onOpenFile={onOpenFile} />
      </I18nProvider>
    );

    // Wait for the initial calendar fetch to complete
    await waitFor(() => {
      expect(screen.getByText(/3 \/ 30/)).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons[0];

    // Click to navigate to August
    fireEvent.click(prevButton);

    // Verify that fetch is called with previous month parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/daily/calendar?year=2026&month=8');
    });
  });
});
