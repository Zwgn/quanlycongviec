import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders taskflow landing title', () => {
  render(<App />);
  const headingElement = screen.getByRole('heading', {
    name: /TaskFlow\s*Quản lý công việc/i,
    level: 1,
  });
  expect(headingElement).toBeInTheDocument();
});
