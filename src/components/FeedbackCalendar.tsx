'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface FeedbackCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  datesWithFeedback: string[]; // Array of date strings in YYYY-MM-DD format
}

export function FeedbackCalendar({ selectedDate, onDateSelect, datesWithFeedback }: FeedbackCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);

  // Convert datesWithFeedback array to Set for O(1) lookup
  const feedbackDatesSet = new Set(datesWithFeedback);

  // Custom modifiers for styling
  const modifiers = {
    hasFeedback: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return feedbackDatesSet.has(dateStr);
    },
  };

  const modifiersClassNames = {
    hasFeedback: 'has-feedback',
  };

  return (
    <div className="flex justify-center">
      <div className="bg-midnight-800 rounded-xl p-4 border border-midnight-700">
        <style dangerouslySetInnerHTML={{__html: `
          .rdp {
            --rdp-cell-size: 40px;
            --rdp-accent-color: #fbbf24;
            --rdp-background-color: #1e293b;
            --rdp-accent-color-dark: #f59e0b;
            --rdp-background-color-dark: #0f172a;
            --rdp-outline: 2px solid var(--rdp-accent-color);
            --rdp-outline-selected: 3px solid var(--rdp-accent-color);
            margin: 0;
            font-family: inherit;
          }

          .rdp-months {
            display: flex;
            justify-content: center;
          }

          .rdp-month {
            margin: 0;
          }

          .rdp-caption {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem;
            color: white;
            font-weight: 600;
          }

          .rdp-caption_label {
            font-size: 1rem;
            color: white;
          }

          .rdp-nav {
            display: flex;
            gap: 0.5rem;
          }

          .rdp-button {
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            background-color: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            color: #fbbf24;
            cursor: pointer;
            transition: all 0.2s;
          }

          .rdp-button:hover {
            background-color: rgba(251, 191, 36, 0.2);
            border-color: rgba(251, 191, 36, 0.5);
          }

          .rdp-button:focus {
            outline: 2px solid rgba(251, 191, 36, 0.5);
            outline-offset: 2px;
          }

          .rdp-table {
            width: 100%;
            max-width: none;
            border-collapse: collapse;
          }

          .rdp-head_cell {
            color: #9ca3af;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .rdp-cell {
            width: var(--rdp-cell-size);
            height: var(--rdp-cell-size);
            text-align: center;
            font-size: 0.875rem;
            padding: 0;
          }

          .rdp-button_reset {
            background-color: transparent;
            border: none;
            cursor: pointer;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
            color: #e5e7eb;
            transition: all 0.2s;
          }

          .rdp-day {
            width: var(--rdp-cell-size);
            height: var(--rdp-cell-size);
            margin: 0;
          }

          .rdp-day:hover .rdp-button_reset {
            background-color: rgba(251, 191, 36, 0.1);
            color: #fbbf24;
          }

          .rdp-day_selected .rdp-button_reset {
            background-color: #fbbf24;
            color: #1e293b;
            font-weight: 700;
          }

          .rdp-day_selected:hover .rdp-button_reset {
            background-color: #f59e0b;
            color: #1e293b;
          }

          .rdp-day_today .rdp-button_reset {
            font-weight: 700;
            border: 1px solid rgba(251, 191, 36, 0.5);
          }

          .rdp-day_outside {
            opacity: 0.3;
          }

          .rdp-day_disabled {
            opacity: 0.2;
            cursor: not-allowed;
          }

          .rdp-day_disabled:hover .rdp-button_reset {
            background-color: transparent;
            color: #9ca3af;
          }

          /* Custom styling for dates with feedback */
          .rdp-day.has-feedback .rdp-button_reset {
            position: relative;
          }

          .rdp-day.has-feedback .rdp-button_reset::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: #fbbf24;
          }

          .rdp-day.has-feedback.rdp-day_selected .rdp-button_reset::after {
            background-color: #1e293b;
          }
        `}} />
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onDateSelect(date);
            }
          }}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="text-white"
          classNames={{
            months: 'months',
            month: 'month',
            caption: 'caption',
            caption_label: 'caption_label',
            nav: 'nav',
            nav_button: 'button',
            nav_button_previous: 'button',
            nav_button_next: 'button',
            table: 'table',
            head_row: 'head_row',
            head_cell: 'head_cell',
            row: 'row',
            cell: 'cell',
            day: 'day',
            day_button: 'button_reset',
            day_selected: 'day_selected',
            day_today: 'day_today',
            day_outside: 'day_outside',
            day_disabled: 'day_disabled',
            day_range_middle: 'day_range_middle',
            day_hidden: 'day_hidden',
          }}
        />
      </div>
    </div>
  );
}

