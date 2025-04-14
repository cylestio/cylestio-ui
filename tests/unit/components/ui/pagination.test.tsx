import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Pagination } from '@/components/ui/pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 100,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pagination with current page info', () => {
    render(<Pagination {...defaultProps} />);
    
    expect(screen.getByText('Showing')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('to')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('of')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('results')).toBeInTheDocument();
  });

  it('calls onPageChange when next button is clicked', () => {
    render(<Pagination {...defaultProps} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when previous button is clicked', () => {
    render(<Pagination {...defaultProps} currentPage={2} />);
    
    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when a page number is clicked', () => {
    render(<Pagination {...defaultProps} />);
    
    // Page 2 should be visible
    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders page size selector when onPageSizeChange is provided', () => {
    const onPageSizeChange = jest.fn();
    render(<Pagination {...defaultProps} onPageSizeChange={onPageSizeChange} />);
    
    expect(screen.getByText('Show')).toBeInTheDocument();
    const pageSizeSelect = screen.getByRole('combobox');
    expect(pageSizeSelect).toBeInTheDocument();
    
    // Check if all the page size options are rendered
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4); // Default options: 10, 25, 50, 100
    expect(options[0]).toHaveValue('10');
    expect(options[1]).toHaveValue('25');
    expect(options[2]).toHaveValue('50');
    expect(options[3]).toHaveValue('100');
  });

  it('calls onPageSizeChange when page size is changed', () => {
    const onPageSizeChange = jest.fn();
    render(<Pagination {...defaultProps} onPageSizeChange={onPageSizeChange} />);
    
    const pageSizeSelect = screen.getByRole('combobox');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });

  it('handles jump to page functionality', () => {
    render(<Pagination {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('#');
    const goButton = screen.getByText('Go');
    
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(goButton);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(5);
  });

  it('does not jump to page on invalid input', () => {
    render(<Pagination {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('#');
    const goButton = screen.getByText('Go');
    
    // Test with non-numeric input
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(goButton);
    expect(defaultProps.onPageChange).not.toHaveBeenCalled();
    
    // Test with out-of-range page number
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.click(goButton);
    expect(defaultProps.onPageChange).not.toHaveBeenCalled();
  });

  it('renders ellipsis for many pages', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalItems={500} />);
    
    const ellipsisElements = screen.getAllByText('...');
    expect(ellipsisElements.length).toBeGreaterThan(0);
  });

  it('returns null when totalItems is 0', () => {
    const { container } = render(<Pagination {...defaultProps} totalItems={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('applies custom className', () => {
    const { container } = render(<Pagination {...defaultProps} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
}); 